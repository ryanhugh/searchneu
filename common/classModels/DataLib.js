/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import Class from './Class';
import macros from '../commonMacros';

class DataLib {
  constructor(termDump) {
    this.termDump = termDump;
  }


  static loadData(termDump) {
    if (!termDump.classMap || !termDump.sectionMap) {
      macros.error('invalid termDump', termDump);
      return null;
    }

    return new this(termDump);
  }

  // Right now only the class that is created is loaded. Need to add loading on demand later for times when you need more info on prereqs, corereqs, etc (prereq.prereq.prereq...)
  // That is not needed for this project, however.
  static createClassFromSearchResult(searchResultData) {
    const aClass = Class.create(searchResultData.class);
    aClass.loadSectionsFromServerList(searchResultData.sections);
    return aClass;
  }

  // Returns a list of the keys in a subject, sorted by classId
  // Usually takes ~ 5ms and does not instantiate any instances of Class or Subject
  getClassesInSubject(subject) {
    const keys = Object.keys(this.termDump.classMap);

    const startTime = Date.now();

    const retVal = [];
    for (const key of keys) {
      const row = this.termDump.classMap[key];
      if (row.subject === subject) {
        retVal.push(key);
      }
    }

    // Sort the classes
    retVal.sort((a, b) => {
      return parseInt(this.termDump.classMap[a].classId, 10) - parseInt(this.termDump.classMap[b].classId, 10);
    });

    // Turn this into a analytics call when that is working
    macros.log('send', 'timing', subject, 'subject', Date.now() - startTime);

    return retVal;
  }


  getSubjects() {
    return Object.values(this.termDump.subjectMap);
  }

  getClassServerDataFromHash(hash) {
    return this.termDump.classMap[hash];
  }

  getSectionServerDataFromHash(hash) {
    return this.termDump.sectionMap[hash];
  }
}

export default DataLib;
