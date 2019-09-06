
/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import path from 'path';
import fs from 'fs-extra';
import { errors } from '@elastic/elasticsearch';
import _ from 'lodash';
import macros from '../../macros';
import mapping from './employeeMapping.json';
import Elastic, { EMPLOYEE_INDEX } from '../../elastic';

// Creates the search index for employees


class SearchIndex {
  async main(employeeDump) {
    const employeeMap = _.mapValues(employeeDump, (employee) => {
      return { employee: employee, type: 'employee' };
    });
    await Elastic.resetIndex(EMPLOYEE_INDEX, mapping);
    macros.log('performing bulk insert to index employees');
    await Elastic.bulkIndexFromMap(EMPLOYEE_INDEX, employeeMap);
    macros.log('indexed employees');
  }
}

const instance = new SearchIndex();

async function fromFile(filePath) {
  const exists = await fs.pathExists(filePath);
  if (!exists) {
    macros.error('need to run scrape before indexing');
    return;
  }
  const termDump = await fs.readJson(filePath);
  instance.main(termDump);
}

if (require.main === module) {
  // If called directly, attempt to index the dump in public dir
  const filePath = path.join(macros.PUBLIC_DIR, 'employeeDump.json');
  fromFile(filePath).catch(macros.error);
}

export default instance;
