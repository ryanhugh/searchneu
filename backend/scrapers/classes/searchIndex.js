/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import path from 'path';
import fs from 'fs-extra';
import macros from '../../macros';
import Keys from '../../../common/Keys';
import mapping from './classMapping.json';
import elastic from '../../elastic';

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
        type: 'class',
      };
    });

    // Sort sections by crn.
    // This will keep the sections the same between different scrapings.
    termDump.sections.sort((a, b) => {
      return a.crn > b.crn;
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

    await elastic.resetIndex(elastic.CLASS_INDEX, mapping);
    macros.log('performing bulk insert to index classes');
    await elastic.bulkIndexFromMap(elastic.CLASS_INDEX, classes);
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

const instance = new SearchIndex();

async function fromFile(filePath) {
  const exists = await fs.pathExists(filePath);
  if (!exists) {
    macros.error('need to run scrape or scrape_classes before indexing');
    return;
  }
  const termDump = await fs.readJson(filePath);
  instance.main(termDump);
}

if (require.main === module) {
  // If called directly, attempt to index the dump in public dir
  const filePath = path.join(macros.PUBLIC_DIR, 'getTermDump', 'allTerms.json');
  fromFile(filePath).catch(macros.error);
}

export default instance;
