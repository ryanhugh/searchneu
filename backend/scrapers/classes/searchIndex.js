/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import macros from '../../macros';
import Keys from '../../../common/Keys';
import mapping from '../esMapping.json';
import Elastic from '../../elastic';

// Creates the search index for classes


class SearchIndex {
  attachSectionsToClasses(termDump) {
    // Hashmap of all classes. Used to more quickly lookup classes
    const classMap = {};

    termDump.classes.forEach((aClass) => {
      const classHash = Keys.getClassHash(aClass);

      classMap[classHash] = {
        class: aClass,
        sections: [],
      };
    });

    // Loop through all sections and associate them with the right class
    termDump.sections.forEach((section) => {
      const classHash = Keys.getClassHash({
        host: section.host,
        termId: section.termId,
        subject: section.subject,
        classId: section.classId,
      });

      if (!classMap[classHash]) {
        // This should never happen now that the bug has been fixed.
        macros.error('No class exists with same data?', classHash, section.url);
        return;
      }

      classMap[classHash].sections.push(section);
    });
    return classMap;
  }

  async createSearchIndex(termDump) {
    const classes = this.attachSectionsToClasses(termDump);

    const bulk = [];
    for (const classHash of Object.keys(classes)) {
      const clas = classes[classHash];
      // Sort each classes section by crn.
      // This will keep the sections the same between different scrapings.
      if (clas.sections.length > 1) {
        clas.sections.sort((a, b) => {
          return a.crn > b.crn;
        });
      }

      // Add a code attribute (CS2500) and tokenize it using word_delimiter
      // This allows "cs2500" and "cs 2500" to both find class.code correctly.
      clas.code = clas.subject + clas.classId;
      clas.type = 'class';

      bulk.push({ index: { _id: classHash } });
      bulk.push(clas);
    }
    await Elastic.resetIndex('classes', mapping);
    macros.log('performing bulk insert to index classes');
    await Elastic.bulk({ index: 'classes', body: bulk });
    macros.log('indexed classes');
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
