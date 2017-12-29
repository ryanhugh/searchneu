/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import macros from '../../../macros';
import ellucianRequisitesParser from '../parsers/ellucianRequisitesParser';
import BaseProcessor from './baseProcessor';
import Keys from '../../../../common/Keys';

// This file process the prereqs on each class and ensures that they point to other, valid classes.
// If they point to a class that does not exist, they are marked as missing.

class MarkMissingPrereqs extends BaseProcessor.BaseProcessor {
  updatePrereqs(prereqs, host, termId, keyToRows) {
    for (let i = prereqs.values.length - 1; i >= 0; i--) {
      const prereqEntry = prereqs.values[i];

      // prereqEntry could be Object{subject:classId:} or string i think
      if (typeof prereqEntry === 'string') {
        continue;
      } else if (prereqEntry.classId && prereqEntry.subject) {
        const hash = Keys.create({
          host: host,
          termId: termId,
          subject: prereqEntry.subject,
          classId: prereqEntry.classId,
        }).getHash();

        if (!keyToRows[hash]) {
          prereqs.values[i].missing = true;
        }
      } else if (prereqEntry.type && prereqEntry.values) {
        this.updatePrereqs(prereqEntry, host, termId, keyToRows);
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
    const keyToRows = this.getClassHash(termDump);

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


MarkMissingPrereqs.prototype.MarkMissingPrereqs = MarkMissingPrereqs;
const instance = new MarkMissingPrereqs();


if (require.main === module) {
  instance.go([{
    host: 'neu.edu',
  }], (err) => {
    macros.log('DONE!', err);
  });
}


export default instance;
