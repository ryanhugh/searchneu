import fs from 'fs-promise';

import DataLib from '../common/classModels/DataLib';

import Request from './scrapers/request';

import macros from './macros';
import database from './database';
import Keys from '../common/Keys'
import ellucianCatalogParser from './scrapers/classes/parsers/ellucianCatalogParser'


class Updater {
  constructor(dataLib) {
    this.dataLib = dataLib;
  }


  static create(dataLib) {
    if (!dataLib) {
      macros.error('Invalid dataLib', dataLib);
      debugger
      return;
    }

    return new this(dataLib);
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


    let sectionHashMap = {};
    let sections = [];

    for (let sectionHash of sectionHashes) {

      let aClass = this.dataLib.getSectionServerDataFromHash(sectionHash)

      sections.push(aClass);
      sectionHashMap[sectionHash] = aClass;
    }    



    // Get the data for these hashes
    let classes = [];
    for (let classHash of classHashes) {

      let aClass = this.dataLib.getClassServerDataFromHash(classHash)

      classes.push(aClass);

      for (let crn of aClass.crns) {
        let sectionHash = Keys.create({
          host: aClass.host,
          termId: aClass.termId,
          subject: aClass.subject,
          classUid: aClass.classUid,
          crn: crn
        })

        // Remove this one from the hash map
        sectionHashMap[sectionHash] = false;
      }
    }


    // Find the sections that are still around
    for (let sectionHash of Object.keys(sectionHashMap)) {
      // If it was set to false, ignore it
      if (!sectionHashMap[sectionHash]) {
        continue;
      }


      macros.error("Section", sectionHash, "is being watched but it's class is not being watched?");
    }



    // Scrape the latest data
    for (let aClass of classes) {
      let latestData = await ellucianCatalogParser.main(aClass.prettyUrl)
      debugger

    }






    // Make sure that all the sections are contained by all the classes

    // Make a map of all the section hashes
    let sectionMap = {}





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


async function getFrontendData(path) {
  const body = await fs.readFile(path);
  return JSON.parse(body);
}

async function test() {
  const termDumpPromise = getFrontendData('./public/data/getTermDump/neu.edu/201810.json');

  const spring2018DataPromise = getFrontendData('./public/data/getTermDump/neu.edu/201830.json');

  const fallData = await termDumpPromise;

  const springData = await spring2018DataPromise;

  const dataLib = DataLib.loadData({
    201810: fallData,
    201830: springData,
  });

  const instance = Updater.create(dataLib);

  instance.onInterval();
}
test();


export default Updater;
