/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import Class from './Class';
import macros from '../commonMacros';


// Holds the class data that is used by the search backend
// and the updater.js

class DataLib {
  constructor(termDumpMap) {
    this.termDumpMap = termDumpMap;


    // Classes in different terms will never have conflicting hashes
    // This is a hash map that includes all classes from every term
    // Used for looking up classes in constant time from any term
    this.allClassesMap = {};

    this.allSectionsMap = {};


    // Fill up the above two hash maps
    const termDumps = Object.values(termDumpMap);

    for (const termDump of termDumps) {
      Object.assign(this.allClassesMap, termDump.classMap);
      Object.assign(this.allSectionsMap, termDump.sectionMap);
    }
  }


  static loadData(termDumpMap) {
    const termDumps = Object.values(termDumpMap);

    for (const termDump of termDumps) {
      if (!termDump.classMap || !termDump.sectionMap) {
        macros.error('invalid termDump', !!termDumpMap, Object.keys(termDump));
        return null;
      }
    }


    return new this(termDumpMap);
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
  getClassesInSubject(subject, termId) {
    if (!this.termDumpMap[termId]) {
      macros.error("Data lib dosen't have term", termId);
      return null;
    }

    const termDump = this.termDumpMap[termId];

    const keys = Object.keys(termDump.classMap);

    const startTime = Date.now();

    const retVal = [];
    for (const key of keys) {
      const row = termDump.classMap[key];
      if (row.subject === subject) {
        retVal.push(key);
      }
    }

    // Sort the classes
    retVal.sort((a, b) => {
      return parseInt(termDump.classMap[a].classId, 10) - parseInt(termDump.classMap[b].classId, 10);
    });

    // Turn this into a analytics call when that is working
    macros.log('send', 'timing', subject, 'subject', Date.now() - startTime);

    return retVal;
  }


  getSubjects(termId) {
    if (!this.termDumpMap[termId]) {
      macros.error("Data lib dosen't have term", termId);
      return null;
    }

    return Object.values(this.termDumpMap[termId].subjectMap);
  }

  hasTerm(termId) {
    return !!this.termDumpMap[termId];
  }

  getClassServerDataFromHash(hash) {
    return this.allClassesMap[hash];
  }

  getSectionServerDataFromHash(hash) {
    return this.allSectionsMap[hash];
  }
}

export default DataLib;
