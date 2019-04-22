/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import macros from '../../macros';
import Keys from '../../../common/Keys';
import Elastic from '../../elastic';

// Creates the search index for classes


class SearchIndex {
  // Class Lists object is specific to this file, and is created below.
  async createSearchIndexFromClassLists(termData) {
    const bulk = [];
    for (const attrName2 of Object.keys(termData.classHash)) {
      const searchResultData = termData.classHash[attrName2];

      // Add a code attribute (CS2500) and tokenize it using word_delimiter
      // This allows "cs2500" and "cs 2500" to both find class.code correctly.
      const clas = searchResultData.class;
      clas.code = clas.subject + clas.classId;
      searchResultData.type = 'class';

      bulk.push({ index:{ _id: attrName2 } });
      bulk.push(searchResultData);
    }
    await Elastic.bulk({ index: 'items', body: bulk });
    macros.log('indexed ', termData.termId);
  }


  async createSearchIndex(termDump) {
    const classLists = {};

    termDump.classes.forEach((aClass) => {
      const termHash = Keys.getTermHash({
        host: aClass.host,
        termId: aClass.termId,
      });

      const classHash = Keys.getClassHash(aClass);

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
      const termHash = Keys.getTermHash({
        host: section.host,
        termId: section.termId,
      });

      const classHash = Keys.getClassHash({
        host: section.host,
        termId: section.termId,
        subject: section.subject,
        classId: section.classId,
      });


      if (!classLists[termHash]) {
        // The objects should all have been created when looping over the classes.
        macros.error('Dont have obj in section for loop?', termHash, classHash, section);
        return;
      }

      if (!classLists[termHash].classHash[classHash]) {
        // This should never happen now that the bug has been fixed.
        macros.error('No class exists with same data?', classHash, section.url);
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

    for (const attrName of Object.keys(classLists)) {
      const termData = classLists[attrName];
      promises.push(this.createSearchIndexFromClassLists(termData));
    }

    return Promise.all(promises);
  }


  async main(termDump) {
    if (!termDump) {
      macros.error('Need termDump for scraping classes');
      return;
    }

    await this.createSearchIndex(termDump);
  }
}

export default new SearchIndex();
