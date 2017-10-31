import matchEmployees from './employees/matchEmployees';

import macros from '../macros';
import classes from './classes/main';

// Main file for scraping
// Run this to run all the scrapers
// Make sure this is in PROD mode when scraping on travis

// TODO
// when the frontend for clubs is done, add them to this scraping with:
// import clubs from './clubs';
// , clubs.main() (in main funciton, in the promises = [...] line)


if (process.env.TRAVIS_EVENT_TYPE !== 'cron' && process.env.TRAVIS) {
  console.log('not running on travis event', process.env.TRAVIS_EVENT_TYPE);
  process.exit(0);
}


if (process.env.TRAVIS && macros.DEV) {
  console.log('Not running DEV mode on travis');
  process.exit(1);
}


class Main{

  async main(semesterly=false) {


    let classesPromise = classes.main(['neu'], semesterly=semesterly)

    // If scraping stuff for semesterly, scrape just the classes
    if (semesterly) {
      return classesPromise;
    }


    let promises = [classesPromise, matchEmployees.main()]

    await Promise.all(promises);

    console.log('done scrapers/main.js');
  }

}


const instance = new Main();

if (require.main === module) {
  instance.main(true);
}

export default instance;
