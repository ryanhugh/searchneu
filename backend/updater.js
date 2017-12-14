import fs from 'fs-promise';

import DataLib from '../common/classModels/DataLib';

import Request from './scrapers/request';
import classesScrapers from './scrapers/classes/main'

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

    users = Object.values(users);

    let classHashes = [];
    let sectionHashes = [];

    let sectionHashToUsers = {}
    let classHashToUsers = {}

    for (const user of users) {
      classHashes = user.watchingClasses.concat(classHashes);
      sectionHashes = user.watchingSections.concat(sectionHashes);

      for (let classHash of user.watchingClasses) {
        if (!classHashToUsers[classHash]) {
          classHashToUsers[classHash] = []
        }

        classHashToUsers[classHash].push(user.facebookMessengerId);
      }

      for (let sectionHash of user.watchingSections) {
        if (!sectionHashToUsers[sectionHash]) {
          sectionHashToUsers[sectionHash] = []
        }

        sectionHashToUsers[sectionHash].push(user.facebookMessengerId);
      }
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
        }).getHash()

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


      macros.error("Section", sectionHash, "is being watched but it's class is not being watched?", sectionHashMap);
    }

    let allParsersOutput = []

    // Scrape the latest data
    for (let aClass of classes) {
      let latestData = await ellucianCatalogParser.main(aClass.prettyUrl)

      allParsersOutput = allParsersOutput.concat(latestData)
    }

    let rootNode = {
      type: 'ignore',
      deps: allParsersOutput,
      value: {}
    }


    // Because ellucianCatalogParser returns a list of classes, instead of a singular class, we need to rum it on all of them
    let output = await classesScrapers.runProcessors(rootNode)


    for (let aNewClass of output.classes) {
      let hash = Keys.create(aNewClass).getHash();

      let oldClass = this.dataLib.getClassServerDataFromHash(hash)

      if (aNewClass.crns.length !== oldClass.crns.length) {
        macros.log("Section was added!")
      }
    }


    for (let newSection of output.sections) {
      let hash = Keys.create(newSection).getHash();

      let oldSection = this.dataLib.getClassServerDataFromHash(hash)

      if (aNewClass.seatsRemaining > 0 && oldSection.seatsRemaining <= 0) {
        macros.log("Seat opened up!", hash)
      }
    }


    

    debugger







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
