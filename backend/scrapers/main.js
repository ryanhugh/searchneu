/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import fs from 'fs-extra';
import matchEmployees from './employees/matchEmployees';
import macros from '../macros';
import classes from './classes/main';
import sitemapGenerator from './sitemapGenerator';


// Main file for scraping
// Run this to run all the scrapers
// Make sure this is in PROD mode when scraping on travis

// TODO
// when the frontend for clubs is done, add them to this scraping with:
// import clubs from './clubs';
// , clubs.main() (in main funciton, in the promises = [...] line)


if (process.env.TRAVIS_EVENT_TYPE !== 'cron' && process.env.TRAVIS) {
  macros.log('not running on travis event', process.env.TRAVIS_EVENT_TYPE);
  process.exit(0);
}


if (process.env.TRAVIS && macros.DEV) {
  macros.log('Not running DEV mode on travis');
  process.exit(1);
}


class Main {
  async main(semesterly = false) {
    const classesPromise = classes.main(['neu'], semesterly);

    // If scraping stuff for semesterly, scrape just the classes
    if (semesterly) {
      return classesPromise;
    }


    const promises = [classesPromise, matchEmployees.main()];

    const [termDump, mergedEmployees] = await Promise.all(promises);

    await sitemapGenerator.go(termDump, mergedEmployees);

    macros.log('done scrapers/main.js');

    return null;
  }
}


const instance = new Main();


async function localRun() {
  if (require.main === module) {
    // Change it to .main(true) to run the Semester.ly code
    const semesterlyData = await instance.main(false);

    if (semesterlyData) {
      await fs.writeFile('semesterly_courses.json', JSON.stringify(semesterlyData));
      macros.log('Saved output for semesterly!');
    }
  }
}

localRun();

export default instance;
