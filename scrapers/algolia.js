import algoliasearch from 'algoliasearch';
import fs from 'fs-promise';
import _ from 'lodash';
import path from 'path';

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


  async addObjects(objects) {
    const existingDataMap = await this.getAllRows();

    // Objects that are new or have changed since the last scraping
    let toAdd = []

    // Objects that no longer exist
    let toRemove = []

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

      if (!existingDataMap[object.ObjectID]) {
        console.log('Adding', object.type,object.ObjectID)
        toAdd.push(object);
      }

      // Update the DB
      else if (!_.isEqual(existingDataMap[object.ObjectID], object)) {
        console.log(object.type, object.ObjectID, 'was not the same, not updating db.');
        toAdd.push(object)
      }
      else {
        sameCount++;
        console.log('Object was the same ', object.type, object.ObjectID);
      }

      // Clear out this item from the exiting data
      // Any items remaining when we are done are not present in the new data and need to be removed from algolia.
      existingDataMap[object.ObjectID] = undefined
    }

    
    let oldObjects = Object.values(existingDataMap)
    for (const object of oldObjects) {

      // Add any object that is not undefined
      if (object) {
        toRemove.push(object)
      }
    }

    console.log('Going to remove ', toRemove.length, 'objects.');
    console.log('Going to add', toAdd.length, 'objects.');
    console.log(sameCount, 'objects were the same.')

    // Don't update anything if nothing changed. 
    if (toAdd.length === 0 && toRemove.length === 0) {
      console.log('No items to add or remove from search index, no action taken.')
      return;
    }

    // Update algolia.
    if (macros.PROD) {
      const index = await this.getAlgoliaIndex();
      await index.addObjects(toAdd);
      await index.deleteObjects(toRemove);
    }
    else {
      const algoliaJSON = path.join(macros.DEV_DATA_DIR, 'algolia.json')
      const oldFile = path.join(macros.DEV_DATA_DIR, 'algolia_old_'+String(Date.now())+'.json')

      // Copy the algolia.json to a backup file. 
      await fs.rename(algoliaJSON, oldFile)
      await fs.writeFile(algoliaJSON, JSON.stringify(objects, null, 4))
      console.log('Wrote new file and backed up old file to', oldFile);
    }


  }

  async getRowsFromFile() {
    const results = JSON.parse(await fs.readFile(path.join(macros.DEV_DATA_DIR, 'algolia.json')));

    const hashmap = {};
    for (const result of results) {
      hashmap[result.ObjectID] = result;
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
          hashmap[result.ObjectID] = result;
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
    if (macros.DEV || macros.TEST) {
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

export default new Algolia();
