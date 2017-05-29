import algoliasearch from 'algoliasearch';
import fs from 'fs-promise';
import _ from 'lodash';
import path from 'path';
import { diff } from 'deep-diff';

import macros from './macros';
import utils from './utils';

// TODO
// it would be cool if dev could update prod somehow....
// like maybe keep track of when the data was downloaded and then use that to determine if the data in algolia is more recent or not?


class Algolia {

  constructor() {
    this.algoliaKey = null;

    // Internal only.
    // When getAlgoliaIndex is called, this is changed to a promise that resolved to a algolia index.
    this.indexPromise = null;

    // Used to load all exiting data from algolia/a file only once.
    this.getRowsPromise = null;

    // this.getAlgoliaIndex();
    // this.getAllRows();
  }


  async getAlgoliaIndex() {
    if (this.indexPromise) {
      return this.indexPromise;
    }

    this.indexPromise = this.getAlgoliaKey().then((key) => {
      // This application ID is Public.
      this.algoliaClient = algoliasearch('KTYX72Q2JT', key);
      return this.algoliaClient.initIndex('data');
      // console.log('Got index!', this.index)
    });
    return this.indexPromise;
  }

  // Used in the deep equals comparisons of objects.
  // Lets lodash do the comparisons for all objects and keys, but if the lastUpdateTime is different,
  // this will cause the _.isEqualWith to still return true
  lodashCustomizer(objValue, othValue, key) {
    if (key === 'lastUpdateTime') {
      return true;
    }
    return undefined;
  }

  deepDiffLogger(object, diffOutput) {
    for (const diffItem of diffOutput) {
      if (diffItem.kind === 'E') {
        if (diffItem.path[diffItem.path.length - 1] === 'lastUpdateTime') {
          continue;
        }

        console.log(object.objectID, diffItem.path.join('.'), 'from', diffItem.lhs, 'to', diffItem.rhs);
      } else {
        console.log(diffItem);
      }
    }
  }

  async addObjects(objects) {
    const existingDataMap = await this.getAllRows();

    // Objects that are new or have changed since the last scraping
    const toAdd = [];

    // Objects that no longer exist
    const toRemove = [];

    // Number of objects that didn't change
    let sameCount = 0;

    for (const object of objects) {
      // Some sanity checking
      if (!object.type) {
        console.error('Error need type to add to algolia.');
        continue;
      }

      if (!object.class && !object.employee) {
        console.error('Error need class or employee to add to algolia.');
        continue;
      }


      if (!existingDataMap[object.objectID]) {
        console.log('Adding', object.type, object.objectID);
        toAdd.push(object);
      }

      // Update the DB
      else if (!_.isEqualWith(existingDataMap[object.objectID], object, this.lodashCustomizer.bind(this))) {
        this.deepDiffLogger(object, diff(existingDataMap[object.objectID], object), null, 4);
        toAdd.push(object);
      } else {
        sameCount++;
        // console.log('Object was the same ', object.type, object.objectID);
      }

      // Clear out this item from the exiting data
      // Any items remaining when we are done are not present in the new data and need to be removed from algolia.
      existingDataMap[object.objectID] = undefined;
    }


    const oldObjects = Object.values(existingDataMap);
    for (const object of oldObjects) {
      // Add any object that is not undefined
      if (object) {
        toRemove.push(object.objectID);
      }
    }

    console.log('Going to remove ', toRemove.length, 'objects.');
    console.log('Going to add/update', toAdd.length, 'objects.');
    console.log(sameCount, 'objects were the same.');

    // Don't update anything if nothing changed.
    if (toAdd.length === 0 && toRemove.length === 0) {
      console.log('No items to add or remove from search index, no action taken.');
      return;
    }

    // Sanity checking
    for (const obj of toAdd) {
      if (!obj.objectID || typeof obj.objectID !== 'string') {
        console.error('Invalid objectID!', obj);
        console.error('Exiting!')
        return;
      }
    }

    // Update algolia.
    if (macros.PROD) {
      const index = await this.getAlgoliaIndex();
      await index.addObjects(toAdd);
      await index.deleteObjects(toRemove);
    } else {
      const algoliaJSON = path.join(macros.DEV_DATA_DIR, 'algolia.json');
      const oldFile = path.join(macros.DEV_DATA_DIR, `algolia_old_${String(Date.now())}.json`);

      // Copy the algolia.json to a backup file.
      await fs.rename(algoliaJSON, oldFile);
      await fs.writeFile(algoliaJSON, JSON.stringify(objects, null, 4));
      console.log('Wrote new file and backed up old file to', oldFile);
    }
  }

  async getRowsFromFile() {
    const results = JSON.parse(await fs.readFile(path.join(macros.DEV_DATA_DIR, 'algolia.json')));

    const hashmap = {};
    for (const result of results) {
      hashmap[result.objectID] = result;
    }

    return hashmap;
  }

  async getRowsFromAlgolia() {
    const index = await this.getAlgoliaIndex();

    return new Promise((resolve, reject) => {
      const browser = index.browseAll();
      let hits = [];

      browser.on('result', (content) => {
        hits = hits.concat(content.hits);
      });

      browser.on('end', () => {
        const hashmap = {};
        for (const result of hits) {
          hashmap[result.objectID] = result;
        }

        resolve(hashmap);
      });

      browser.on('error', (err) => {
        reject(err);
      });
    });
  }


  async getAllRows() {
    if (this.getRowsPromise) {
      return this.getRowsPromise;
    }

    // Load from file if not in PROD.
    let promise;
    if ((macros.DEV || macros.TEST)) {
      promise = this.getRowsFromFile();
    } else {
      promise = this.getRowsFromAlgolia();
    }


    this.getRowsPromise = promise;
    return promise;
  }

  // Grab they key from the env or the config file.
  async getAlgoliaKey() {
    if (this.algoliaKey) {
      return this.algoliaKey;
    }

    if (process.env.ALGOLIA_KEY) {
      this.algoliaKey = process.env.ALGOLIA_KEY;
      return process.env.ALGOLIA_KEY;
    }

    // Check two different paths for they API key.
    let config;
    try {
      config = JSON.parse(await fs.readFile('/etc/searchneu/config.json'));
    } catch (e) {
      // Bash Subsystem for Linux.
      config = JSON.parse(await fs.readFile('/mnt/c/etc/searchneu/config.json'));
    }

    if (!config.algoliaSearchApiKey) {
      utils.critical('Could not get algolia search key!', config);
    }

    this.algoliaKey = config.algoliaSearchApiKey;

    return config.algoliaSearchApiKey;
  }

}

const instance = new Algolia();

async function test() {
  const rows = await instance.getRowsFromAlgolia();
  console.log(rows);
}

if (require.main === module) {
  test();
}

export default instance;
