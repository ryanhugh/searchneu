/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import BaseProcessor from './baseProcessor';
import macros from '../../../macros';

// THIS DOES NOT WORK YET
// This find classes that are called "lab for " and "recitation for " and "Interactive Learning Seminar for PHYS 1155"
// that don't have coreqs and marks them as having coreqs
// as of july 2016 there are abou 52 classes in each term in neu that this finds, and 0 at swarthmore
//
// ALSO: make sure to remove any classes added to coreqs from prereqs. ENVR 1201 (lab for 1200) has 1200 as a prereq


class FindMissingLabs extends BaseProcessor.BaseProcessor {
  go(query, callback) {
    this.getClassHash(query, (err, keyToRow) => {
      for (const key of Object.keys(keyToRow)) {
        const aClass = keyToRow[key];

        const name = aClass.name;

        const match = name.match(/\s+for\s+([A-Z\d]+|[A-Z\d&]{2,})\s+([A-Z\d&]+)/g);
        if (match) {
          let coreqsArray = [];
          if (aClass.coreqs) {
            coreqsArray = aClass.coreqs.values;
          }
          if (coreqsArray.length > 0) {
            continue;
          }

          macros.warn(match, name, coreqsArray.length, aClass.desc);
        }
      }
      return callback();
    });
  }
}

const instance = new FindMissingLabs();

if (require.main === module) {
  instance.go({ host:'neu.edu', termId:'201630' });
}

export default instance;
