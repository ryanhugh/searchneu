/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import path from 'path';
import mkdirp from 'mkdirp-promise';
import fs from 'fs-extra';

import macros from '../../macros';
import Keys from '../../../common/Keys';

// Creates the term dump of classes.


class TermDump {
  async main(termDump) {
    const termMapDump = {};
    macros.log('TERM DUMPING')


    for (const aClass of termDump.classes) {
      const hash = Keys.getClassHash(aClass);

      const termHash = Keys.getTermHash({
        host: aClass.host,
        termId: aClass.termId,
      });

      if (!termMapDump[termHash]) {
        termMapDump[termHash] = {
          classMap: {},
          sectionMap: {},
          subjectMap: {},
          termId: aClass.termId,
          host: aClass.host,
        };
      }

      termMapDump[termHash].classMap[hash] = aClass;
    }

    for (const section of termDump.sections) {
      const hash = Keys.getSectionHash(section);

      const termHash = Keys.getTermHash({
        host: section.host,
        termId: section.termId,
      });

      if (!termMapDump[termHash]) {
        macros.log('Found section with no class?', termHash, hash);
        termMapDump[termHash] = {
          classMap: {},
          sectionMap: {},
          subjectMap: {},
          termId: section.termId,
          host: section.host,
        };
      }

      termMapDump[termHash].sectionMap[hash] = section;
    }

    const promises = [];

    const values = Object.values(termMapDump);

    for (const value of values) {
      // Put them in a different file.
      if (!value.host || !value.termId) {
        macros.error('No host or Id?', value);
      }

      const folderPath = path.join(macros.PUBLIC_DIR, 'getTermDump', value.host);
      promises.push(mkdirp(folderPath).then(() => {
        return fs.writeFile(path.join(folderPath, `${value.termId}.json`), JSON.stringify(value));
      }));
    }
    const outerFolderPath = path.join(macros.PUBLIC_DIR, 'getTermDump');
    promises.push(mkdirp(outerFolderPath).then(() => {
      return fs.writeFile(path.join(outerFolderPath, 'allTerms.json'), JSON.stringify(termDump));
    }));
    return Promise.all(promises);
  }
}


export default new TermDump();
