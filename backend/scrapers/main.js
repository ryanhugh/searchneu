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


async function main() {


  let promises = []

  promises.push(classes.main(['neu']))

  // If not only scraping stuff for semesterly, scrape the employees too
  if (!process.env.SEMESTERLY) {
    promises.push(matchEmployees.main())
  }

  await Promise.all(promises);

  console.log('done scrapers/main.js');
}


main();
