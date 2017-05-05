import elasticlunr from 'elasticlunr';
import path from 'path';
import mkdirp from 'mkdirp-promise';
import fs from 'fs-promise';
const queue = require('d3-queue').queue;

import pageDataMgr from './pageDataMgr';
import macros from '../macros';
import utils from '../utils';
import Keys from '../../common/Keys';


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
          classes: {},
          sections: {},
          subjects: {},
          termId: aClass.termId,
          host: aClass.host,
        };
      }

      termMapDump[termHash].classes[hash] = aClass;
    }

    for (const subject of termDump.subjects) {
      const hash = Keys.create(subject).getHash();

      const termHash = Keys.create({
        host: subject.host,
        termId: subject.termId,
      }).getHash();

      if (!termMapDump[termHash]) {
        console.log('Found subject with no class?');
        termMapDump[termHash] = {
          classes: {},
          sections: {},
          subjects: {},
          termId: subject.termId,
          host: subject.host,
        };
      }

      termMapDump[termHash].subjects[hash] = subject;
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
          classes: {},
          sections: {},
          subjects: {},
          termId: section.termId,
          host: section.host,
        };
      }

      termMapDump[termHash].sections[hash] = section;
    }


    for (const termHash in termMapDump) {

      const value = termMapDump[termHash]

      // Put them in a different file.
      if (!value.host || !value.termId) {
        utils.error('No host or Id?', value);
      }

      const folderPath = path.join(macros.PUBLIC_DIR, 'getTermDump', value.host);
      await mkdirp(folderPath);
      await fs.writeFile(path.join(folderPath, value.termId), JSON.stringify(value));
    }
  }


  createSerchIndex(termDump) {
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
        utils.error('No class exists with same data?', classHash, section.url);
        errorCount++;
        return;
      }

      classLists[termHash].classHash[classHash].sections.push(section);
    });


    const q = queue(1);

    for (const attrName in classLists) {
      q.defer(((attrName, callback) => {
        const termData = classLists[attrName];
        const keys = Keys.create(termData);

        const index = elasticlunr();

        index.saveDocument(false);

        index.setRef('key');
        // index.addField('desc');
        index.addField('name');
        index.addField('classId');
        index.addField('subject');
        index.addField('profs');

        // Lets disable this until buildings are added to the index and the DB.
        // Dosen't make sense for classes in a building to come up when the building name is typed in the search box.
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
          let locations = [];
          searchResultData.sections.forEach((section) => {
            if (section.meetings) {
              section.meetings.forEach((meeting) => {
                if (meeting.profs) {
                  profs = profs.concat(meeting.profs);
                }

                if (meeting.where) {
                  locations.push(meeting.where);
                }
              });
            }
          });


          toIndex.profs = profs.join(' ');
          toIndex.locations = locations.join(' ');
          if (searchResultData.class.crns) {
            toIndex.crns = searchResultData.class.crns.join(' ');
          }

          index.addDoc(toIndex);
        }

        const searchIndexString = JSON.stringify(index.toJSON());

        const fileName = path.join(macros.PUBLIC_DIR, keys.getHashWithEndpoint(getSearchIndex));
        const folderName = path.dirname(fileName);

        mkdirp(folderName, (err) => {
          if (err) {
            return callback(err);
          }

          fs.writeFile(fileName, searchIndexString, (err) => {
            if (err) {
              return callback(err);
            }

            console.log('Successfully saved', fileName, 'errorCount:', errorCount);

            classLists[attrName] = null;

            return callback();
          });
        });
      }).bind(this, attrName));
    }

    return new Promise((resolve, reject) => {
      q.awaitAll((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }


  async main(hostnames) {
    if (!hostnames) {
      console.error('Need hostnames for scraping classes');
      return;
    }

    const termDump = await pageDataMgr.main(hostnames);
    console.log(termDump);
    console.log('HI', !!termDump);
    await this.createSerchIndex(termDump);
    await this.createDataDumps(termDump);
  }


}

const instance = new Main();


if (require.main === module) {
  instance.main(['presby']);
}

export default instance;
