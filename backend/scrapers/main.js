/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

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
  async main() {
    const classesPromise = classes.main(['neu']);

    const promises = [classesPromise, matchEmployees.main()];

    const [termDump, mergedEmployees] = await Promise.all(promises);

    await sitemapGenerator.go(termDump, mergedEmployees);

    macros.log('done scrapers/main.js');
  }
}

const instance = new Main();

if (require.main === module) {
  instance.main();
}

export default instance;
