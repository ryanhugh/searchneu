/* eslint-disable no-underscore-dangle */
/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import macros from './macros';
import Keys from '../common/Keys';
import Elastic from './elastic';

// Holds the class data that is used by the search backend
// and the updater.js

const DataLib = {
  getClassesInTerm: async (termId) => {
    const index = `term${termId}`;
    if (!(await DataLib.hasTerm(termId))) {
      return [];
    }

    const searchOutput = await Elastic.search({
      index: index,
      size: 10000,
      body: {
        query: {
          match_all: {},
        },
      },
    });
    return searchOutput.body.hits.hits.map((hit) => {
      return hit._source.class;
    });
  },

  getSectionsInTerm: async (termId) => {
    const index = `term${termId}`;
    if (!(await DataLib.hasTerm(termId))) {
      return [];
    }
    const searchOutput = await Elastic.search({
      index: index,
      size: 10000,
      body: {
        query: {
          match_all: {},
        },
      },
    });
    return searchOutput.body.hits.hits.reduce((arr, hit) => {
      return arr.concat(hit._source.sections);
    }, []);
  },

  getSubjects: (termId) => {
    if (!this.termDumpMap[termId]) {
      macros.error("Data lib dosen't have term", termId);
      return null;
    }

    return Object.values(this.termDumpMap[termId].subjectMap);
  },

  hasTerm: async (termId) => {
    return Elastic.indices.exists({ index: `term${termId}` });
  },

  getClassServerDataFromHash: async (hash) => {
    // It'd be more efficient to use Elastic's GET document API,
    // but that you can't get by id across indices, so we have to use search endpoint.
    const searchOutput = await Elastic.search({
      index: 'term*',
      body: {
        query: {
          bool: {
            filter: {
              term: { _id: hash },
            },
          },
        },
      },
    });
    return searchOutput.body.hits.hits[0]._source.class;
  },

  getSectionServerDataFromHash: async (hash) => {
    const searchOutput = await Elastic.search({
      index: 'term*',
      body: {
        query: {
          bool: {
            filter: {
              term: { _id: hash },
            },
          },
        },
      },
    });
    return searchOutput.body.hits.hits[0]._source.class;
  },

  setClass: (aClass) => {
    const hash = Keys.getClassHash(aClass);

    if (!this.termDumpMap[aClass.termId]) {
      macros.error('Cannot set class in non-existent term.');
      return;
    }

    this.allClassesMap[hash] = aClass;

    this.termDumpMap[aClass.termId].classMap[hash] = aClass;
  },

  setSection: (section) => {
    const hash = Keys.getSectionHash(section);

    if (!this.termDumpMap[section.termId]) {
      macros.error('Cannot set section in non-existent term.');
      return;
    }

    this.allSectionsMap[hash] = section;

    this.termDumpMap[section.termId].sectionMap[hash] = section;
  },
};

export default DataLib;
