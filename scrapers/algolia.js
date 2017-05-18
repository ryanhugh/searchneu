import algoliasearch from 'algoliasearch';
import fs from 'fs-promise';

class Algolia {

  constructor() {
    this.algoliaKey = null;

    this.getAlgoliaIndex()
  }


  async getAlgoliaIndex() {
    if (this.index) {
      return this.index
    }

    // This application ID is Public. 
    this.algoliaClient = algoliasearch('KTYX72Q2JT', (await this.getAlgoliaKey()));
    this.index = this.algoliaClient.initIndex('data');
    console.log('Got index!', index)
  }

  // Grab they key from the env or the config file. 
  async getAlgoliaKey() {

    if (this.algoliaKey) {
      return this.algoliaKey;
    }

    if (process.env.ALGOLIA_KEY) {
      this.algoliaKey = process.env.ALGOLIA_KEY
      return process.env.ALGOLIA_KEY;
    }

    // Check two different paths for they API key. 
    let config;
    try {
      config = JSON.parse(await fs.readFile('/etc/searchneu/config.json'))
    }
    catch (e) {

      // Bash Subsystem for Linux.
      config = JSON.parse(await fs.readFile('/mnt/c/etc/searchneu/config.json'))
    }

    if (!config.algoliaSearchApiKey) {
      utils.critical("Could not get algolia search key!", config);
    }

    this.algoliaKey = config.algoliaSearchApiKey;

    return config.algoliaSearchApiKey;
  }

}

export default new Algolia();