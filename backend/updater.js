
import Request from './scrapers/request';

import macros from './macros';
import database from './database';


class Updater {
  constructor() {
    this.dataLib = null;
  }


  static create(dataLib) {
    if (!dataLib) {
      macros.error('Invalid dataLib', dataLib);
      return;
    }

    this.dataLib = dataLib;
  }


  async onInterval() {
    let users = await database.get('users');

    macros.log(users);

    users = Object.values(users);

    let classHashes = [];
    let sectionHashes = [];

    for (const user of users) {
      classHashes = user.watchingClasses.concat(classHashes);
      sectionHashes = user.watchingSections.concat(sectionHashes);
    }

    // Get the data for these hashes
    const classes = classHashes.map((classHash) => {
      return this.dataLib.getClassServerDataFromHash(classHash);
    });

    const sections = sectionHashes.map((sectionHash) => {
      return this.dataLib.getSectionServerDataFromHash(sectionHash);
    });

    // getClassServerDataFromHash
// getSectionServerDataFromHash


    // Make sure that all the sections are contained by all the classes
    

    


    // get db
    // list hashes
    // get urls from data in ram
    // pull in parsers
    // get latest data
    // compare
    // maybe notify
    // update local data?
  }
}

const instance = new Updater();

export default Updater;
