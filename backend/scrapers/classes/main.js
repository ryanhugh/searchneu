import elasticlunr from 'elasticlunr';
import path from 'path';
import mkdirp from 'mkdirp-promise';
import fs from 'fs-promise';

import pageDataMgr from './pageDataMgr';
import macros from '../macros';
import utils from '../utils';
import Keys from '../../../common/Keys';

// This is the main entry point for scraping classes
// call the main(['neu']) funciton below to scrape a college
// This file also generates the search index and data dumps. 


const getSearchIndex = '/getSearchIndex';

class Main {


  async createDataDumps(termDump) {
    const termMapDump = {};


    for (const aClass of termDump.classes) {
      const hash = Keys.create(aClass).getHash();

      const termHash = Keys.create({
        host: aClass.host,
        termId: aClass.termId,
      }).getHash();

      if (!termMapDump[termHash]) {
        termMapDump[termHash] = {
          classMap: {},
          sectionMap: {},
          subjectMap: {},
          termId: aClass.termId,
          host: aClass.host,
        };
      }

      termMapDump[termHash].classMap[hash] = aClass;
    }

    for (const subject of termDump.subjects) {
      if (!subject.subject) {
        utils.error('Subject controller found in main.js????', subject);
        continue;
      }
      const hash = Keys.create(subject).getHash();

      const termHash = Keys.create({
        host: subject.host,
        termId: subject.termId,
      }).getHash();

      if (!termMapDump[termHash]) {
        console.log('Found subject with no class?');
        termMapDump[termHash] = {
          classMap: {},
          sectionMap: {},
          subjectMap: {},
          termId: subject.termId,
          host: subject.host,
        };
      }

      termMapDump[termHash].subjectMap[hash] = subject;
    }

    for (const section of termDump.sections) {
      const hash = Keys.create(section).getHash();

      const termHash = Keys.create({
        host: section.host,
        termId: section.termId,
      }).getHash();

      if (!termMapDump[termHash]) {
        console.log('Found section with no class?', termHash, hash);
        termMapDump[termHash] = {
          classMap: {},
          sectionMap: {},
          subjectMap: {},
          termId: section.termId,
          host: section.host,
        };
      }

      termMapDump[termHash].sectionMap[hash] = section;
    }

    const promises = [];

    for (const termHash in termMapDump) {
      const value = termMapDump[termHash];

      // Put them in a different file.
      if (!value.host || !value.termId) {
        utils.error('No host or Id?', value);
      }

      const folderPath = path.join(macros.PUBLIC_DIR, 'getTermDump', value.host);
      promises.push(mkdirp(folderPath).then(() => {
        return fs.writeFile(path.join(folderPath, `${value.termId}.json`), JSON.stringify(value));
      }));
    }
    return Promise.all(promises);
  }


  // Class Lists object is specific to this file, and is created below.
  async createSearchIndexFromClassLists(termData, outputExtention = '', includeDesc = true) {
    const keys = Keys.create(termData);

    const index = elasticlunr();

    index.saveDocument(false);

    index.setRef('key');

    // Description is not included on mobile because it is not *really* required, and removing it makes loading on mobile faster.
    if (includeDesc) {
      index.addField('desc');
    }
    index.addField('name');
    index.addField('classId');
    index.addField('subject');

    // Remove profs from here once this data is joined with the prof data and there are UI elements for showing which classes a prof teaches.
    index.addField('profs');

    // Lets disable this until buildings are added to the index and the DB.
    // Dosen't make sense for classes in a building to come up when the building name is typed in the search box.
    // If this is ever enabled again, make sure to add it to the config in home.js too.
    // index.addField('locations');
    index.addField('crns');

    for (const attrName2 in termData.classHash) {
      const searchResultData = termData.classHash[attrName2];

      const toIndex = {
        classId: searchResultData.class.classId,
        desc: searchResultData.class.desc,
        subject: searchResultData.class.subject,
        name: searchResultData.class.name,
        key: Keys.create(searchResultData.class).getHash(),
      };

      let profs = [];
      // let locations = [];
      searchResultData.sections.forEach((section) => {
        if (section.meetings) {
          section.meetings.forEach((meeting) => {
            if (meeting.profs) {
              profs = profs.concat(meeting.profs);
            }

            // if (meeting.where) {
            //   locations.push(meeting.where);
            // }
          });
        }
      });


      toIndex.profs = profs.join(' ');
      // toIndex.locations = locations.join(' ');
      if (searchResultData.class.crns) {
        toIndex.crns = searchResultData.class.crns.join(' ');
      }

      index.addDoc(toIndex);
    }

    const searchIndexString = JSON.stringify(index.toJSON());

    const fileName = path.join(macros.PUBLIC_DIR, `${keys.getHashWithEndpoint(getSearchIndex) + outputExtention}.json`);
    const folderName = path.dirname(fileName);

    await mkdirp(folderName);
    await fs.writeFile(fileName, searchIndexString);
    console.log('Successfully saved', fileName);
  }


  async createSerchIndex(termDump) {
    let errorCount = 0;

    const classLists = {};

    termDump.classes.forEach((aClass) => {
      const termHash = Keys.create({
        host: aClass.host,
        termId: aClass.termId,
      }).getHash();

      const classHash = Keys.create(aClass).getHash();

      if (!classLists[termHash]) {
        classLists[termHash] = {
          classHash: {},
          host: aClass.host,
          termId: aClass.termId,
        };
      }

      classLists[termHash].classHash[classHash] = {
        class: aClass,
        sections: [],
      };
    });


    termDump.sections.forEach((section) => {
      const termHash = Keys.create({
        host: section.host,
        termId: section.termId,
      }).getHash();

      const classHash = Keys.create({
        host: section.host,
        termId: section.termId,
        subject: section.subject,
        classUid: section.classUid,
      }).getHash();


      if (!classLists[termHash]) {
        // The objects should all have been created when looping over the classes.
        utils.error('Dont have obj in section for loop?', termHash, classHash, section);
        errorCount++;
        return;
      }

      if (!classLists[termHash].classHash[classHash]) {
        // Only error on CI if error occurs in the term that is shown.
        // TODO change to if this section occured in the past utils.log, if it is in the future, utils.error.
        if (section.host === 'neu.edu' && section.termId === '201810') {
          utils.error('No class exists with same data?', classHash, section.url);
        } else {
          utils.log('No class exists with same data?', classHash, section.url);
        }
        errorCount++;
        return;
      }

      classLists[termHash].classHash[classHash].sections.push(section);
    });

    // Sort each classes section by crn.
    // This will keep the sections the same between different scrapings.
    const termHashes = Object.keys(classLists);
    for (const termHash of termHashes) {
      const classHashes = Object.keys(classLists[termHash].classHash);
      for (const classHash of classHashes) {
        if (classLists[termHash].classHash[classHash].sections.length > 1) {
          classLists[termHash].classHash[classHash].sections.sort((a, b) => {
            return a.crn > b.crn;
          });
        }
      }
    }


    const promises = [];

    for (const attrName in classLists) {
      const termData = classLists[attrName];
      promises.push(this.createSearchIndexFromClassLists(termData));
      promises.push(this.createSearchIndexFromClassLists(termData, '.mobile', false));
    }

    console.log('Errorcount: ', errorCount);


    return Promise.all(promises);
  }


  async getTermDump(hostnames) {
    const outputFile = path.join(macros.DEV_DATA_DIR, `classes${hostnames.join(',')}.json`);

    // if this is dev and this data is already scraped, just return the data
    if (macros.DEV && require.main !== module) {
      const devData = await utils.loadDevData(outputFile);
      if (devData) {
        return devData;
      }
    }

    const termDump = await pageDataMgr.main(hostnames);

    if (macros.DEV) {
      await utils.saveDevData(outputFile, termDump);
      console.log('classes file saved for', hostnames, '!');
    }
    return termDump;
  }


  async main(hostnames) {
    if (!hostnames) {
      console.error('Need hostnames for scraping classes');
      return;
    }


    const termDump = await this.getTermDump(hostnames);

    await this.createSerchIndex(termDump);
    await this.createDataDumps(termDump);
  }
}

const instance = new Main();

if (require.main === module) {
  instance.main(['neu']);
}

export default instance;
