
import Request from './scrapers/request';

import macros from './macros';
import database from './database';



class Updater {

  constructor() {


    this.termDumps = null;
  }


  static create(termDumps) {
    if (!termDumps) {
      macros.error("Invalid termDumps", termDumps);
      return;
    }

    this.termDumps = termDumps;
  }



  async onInterval() {

    let users = await database.get('users');

    console.log(users)

    users = Object.values(users);

    let classHashes = [];
    let sectionHashes = [];

    for (let user of users) {
      classHashes = user.watchingClasses.concat(classHashes)
      sectionHashes = user.watchingSections.concat(sectionHashes)
    }

    
    // Get the data for these hashes
    let classes = classHashes.map((classHash) => {
      return this.termDumps
    })



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

let instance = new Updater();

export default Updater;