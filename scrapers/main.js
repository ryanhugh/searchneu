import matchEmployees from './matchEmployees';
import clubs from './clubs';
import macros from './macros';
import classes from './classes/main';
import algolia from './algolia'

// Main file for scraping
// Run this to run all the scrapers
// Make sure this is in PROD mode when scraping on travis


if (process.env.TRAVIS_EVENT_TYPE !== 'cron' && process.env.TRAVIS) {
  console.log('not running on travis event', process.env.TRAVIS_EVENT_TYPE);
  process.exit(0);
}

if (process.env.TRAVIS && macros.DEV) {
  console.log('Not running DEV mode on travis');
  process.exit(1);
}


async function main() {
	// , clubs.main()
  const promises = [matchEmployees.main(), classes.main(['neu'])];

  let scrapedDatas = await Promise.all(promises);


  // // Deal with the search index
  // // Need to do all the inserting and deleting in one place 
  // // So we can figure out which items no longer exist in the search index and delete those. 
  // // Concat all the search data together
  // let searchItems = []
  // for (const output of scrapedDatas) {
  // 	if (!output.searchItems) {
  // 		console.error('No searchItems returned?', output)
  // 		continue;
  // 	}

  // 	searchItems = searchItems.concat(output.searchItems)
  // }

  // console.log(searchItems.length, 'items to add to search index.')


  // await algolia.addObjects(searchItems)


  console.log('done scrapers/main.js');
}


main();
