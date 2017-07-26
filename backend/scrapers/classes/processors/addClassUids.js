/*
 * Copyright (c) 2017 Ryan Hughes
 *
 * This file is part of CoursePro.
 *
 * CoursePro is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License
 * version 3 as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import macros from '../../../macros';

import BaseProcessor from './baseProcessor';

// Add classUids to classes. ClassUid = ClassId + '_'  + hash(class.name)
// Lookup by classUid and there will be either 0 or 1 results
// Lookup by classId and there will be 0+ results.

class AddClassUids extends BaseProcessor.BaseProcessor {


  // http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
  getStringHash(input) {
    let hash = 0;
    let i;
    let chr;
    let len;

    if (input.length === 0) {
      macros.error('getStringHash given input.length == 0!!');
      return hash;
    }
    for (i = 0, len = input.length; i < len; i++) {
      chr = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr; // eslint-disable-line no-bitwise

      // Convert to 32bit integer
      hash |= 0;  // eslint-disable-line no-bitwise
    }
    return String(Math.abs(hash));
  }


  getClassUid(classId, title) {
    if (!title) {
      macros.error('get class id given not title!');
    }
    return `${classId}_${this.getStringHash(title)}`;
  }


  // base query is the key shared by all classes that need to be updated
  // if an entire college needs to be updated, it could be just {host:'neu.edu'}
  // at minimum it will be a host
  // or if just one class {host, termId, subject, classId}
  go(termDump) {
    const localKeyToClassMap = {};

    for (const aClass of termDump.classes) {
      aClass.classUid = this.getClassUid(aClass.classId, aClass.name);

      if (aClass.crns) {
        for (const crn of aClass.crns) {
          // Keys.js dosen't support classIds yet, so just make the key here
          const key = aClass.host + aClass.termId + aClass.subject + aClass.classId + crn;

          if (localKeyToClassMap[key]) {
            macros.fatal('key already exists in key map?', key);
          }


          localKeyToClassMap[key] = aClass;
        }
      }
    }


    for (const section of termDump.sections) {
      if (!section.classId) {
        macros.fatal("Can't calculate key without classId");
        return;
      }

      // Keys.js dosen't support classIds yet, so just make the key here
      const key = section.host + section.termId + section.subject + section.classId + section.crn;

      if (!localKeyToClassMap[key]) {
        macros.fatal('no key found!', key, section);
        continue;
      }

      section.classUid = this.getClassUid(section.classId, localKeyToClassMap[key].name);
    }
  }
}

export default new AddClassUids();

