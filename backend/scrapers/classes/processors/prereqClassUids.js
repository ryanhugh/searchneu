/*
 * This file is part of Search NEU and licensed under AGPL3. 
 * See the license file in the root folder for details. 
 */

import macros from '../../../macros';
import ellucianRequisitesParser from '../parsers/ellucianRequisitesParser';
import BaseProcessor from './baseProcessor';

// This file converts prereq classIds to ClassUids by looking up the classes in the db and replacing classIds with classUids
// if there are multiple results, it creates a 'or' prereq tree, much like Class.js does in the frontend.

class PrereqClassUids extends BaseProcessor.BaseProcessor {

  updatePrereqs(prereqs, host, termId, keyToRows) {
    for (let i = prereqs.values.length - 1; i >= 0; i--) {
      const prereqEntry = prereqs.values[i];

      // prereqEntry could be Object{subject:classId:} or string i think
      if (typeof prereqEntry === 'string') {
        continue;
      } else if (prereqEntry.classId && prereqEntry.subject && !prereqEntry.classUid) {
        // multiple classes could have same key
        const key = host + termId + prereqEntry.subject + prereqEntry.classId;

        const newPrereqs = [];

        if (keyToRows[key]) {
          for (const row of keyToRows[key]) {
            // Replace each prereq item with the subject, classUid, and classId
            newPrereqs.push({
              subject: row.subject,
              classUid: row.classUid,
              classId: row.classId,
            });
          }
        }


        // not in db, this is possible and causes those warnings in the frontend
        // unable to find class even though its a prereq of another class????
        if (newPrereqs.length === 0) {
          prereqs.values[i].missing = true;

        // Only one match, just swap classId for classUid.
        } else if (newPrereqs.length === 1) {
          prereqs.values[i] = {
            subject: newPrereqs[0].subject,
            classUid: newPrereqs[0].classUid,
            classId: newPrereqs[0].classId,
          };

        // the fun part - make the 'or' split for multiple classes
        } else {
          prereqs.values[i] = {
            type: 'or',
            values: newPrereqs,
          };
        }
      } else if (prereqEntry.type && prereqEntry.values) {
        prereqs.values[i] = this.updatePrereqs(prereqEntry, host, termId, keyToRows);
      } else if (prereqEntry.classUid && prereqEntry.subject) {
        // don't do anything, this is already fixed
      } else {
        macros.error('wtf is ', prereqEntry, prereqs);
      }
    }
    return prereqs;
  }


  // base query is the key shared by all classes that need to be updated
  // if an entire college needs to be updated, it could be just {host:'neu.edu'}
  // at minimum it will be a host
  // or if just one class {host, termId, subject, classId}
  go(termDump) {
    const keyToRows = this.getClassHash(termDump, {
      useClassId: true,
    });

    const updatedClasses = [];

    // loop through classes to update, and get the new data from all the classes
    for (const aClass of termDump.classes) {
      if (aClass.prereqs) {
        const prereqs = this.updatePrereqs(aClass.prereqs, aClass.host, aClass.termId, keyToRows);

        // And simplify tree again
        aClass.prereqs = ellucianRequisitesParser.simplifyRequirements(prereqs);
      }

      if (aClass.coreqs) {
        const coreqs = this.updatePrereqs(aClass.coreqs, aClass.host, aClass.termId, keyToRows);
        aClass.coreqs = ellucianRequisitesParser.simplifyRequirements(coreqs);


        // Remove honors coreqs from classes that are not honors
        // This logic is currently in the frontend, but should be moved to the backend.
        // and remove non honors coreqs if there is a hon lab with the same classId
        // this isnt going to be 100% reliable across colleges, idk how to make it better, but want to error on the side of showing too many coreqs
      }
      if (aClass.coreqs || aClass.prereqs) {
        updatedClasses.push(aClass);
      }
    }
    return updatedClasses;
  }

}


PrereqClassUids.prototype.PrereqClassUids = PrereqClassUids;
const instance = new PrereqClassUids();


if (require.main === module) {
  instance.go([{
    host: 'neu.edu',
  }], (err) => {
    console.log('DONE!', err);
  });
}


export default instance;
