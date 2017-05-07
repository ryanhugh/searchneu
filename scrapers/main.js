import matchEmployees from './matchEmployees';
import clubs from './clubs';
import macros from './macros';
import classes from './classes/main';

// Main file for scraping
// Run this to run all the scrapers
// Make sure this is in PROD mode when scraping on travis


if (process.env.TRAVIS_EVENT_TYPE !== 'cron' && process.env.TRAVIS) {
  console.log('not running on travis event', process.env.TRAVIS_EVENT_TYPE);
  process.exit(0);
}

// if (process.env.TRAVIS && macros.DEV) {
//   console.log('Not running DEV mode on travis');
//   process.exit(0);
// }


async function main() {
	// , clubs.main()
  const promises = [matchEmployees.main(), classes.main(['neu'])];

  await Promise.all(promises);
  console.log('done');
}


main();
