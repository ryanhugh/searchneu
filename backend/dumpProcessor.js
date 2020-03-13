/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.  */

import fs from 'fs-extra';
import _ from 'lodash';
import path from 'path';
import Keys from '../common/Keys';
import macros from './macros';
import { Professor, Course, Section, Op, sequelize } from './database/models/index';

const profAttributes = Object.keys(_.omit(Professor.rawAttributes, ['id', 'createdAt', 'updatedAt']));
const courseAttributes = Object.keys(_.omit(Course.rawAttributes, ['id', 'createdAt', 'updatedAt']));
const secAttributes = Object.keys(_.omit(Section.rawAttributes, ['id', 'createdAt', 'updatedAt']));

class DumpProcessor {
  constructor() {
    this.CHUNK_SIZE = 2000;
  }

  /**
   * @param {Object} termDump object containing all class and section data, normally acquired from scrapers
   * @param {Object} profDump object containing all professor data, normally acquired from scrapers
   */
  async main({ termDump = {}, profDump = {}, destroy = false }) {
    // the logs on prod are literally running out of space, so stopping sequelize logs for now
    sequelize.options.logging = false;
    const coveredTerms = new Set();

    const profPromises = _.chunk(Object.values(profDump), this.CHUNK_SIZE).map(async (profChunk) => {
      return Professor.bulkCreate(profChunk, { updateOnDuplicate: profAttributes });
    });
    await Promise.all(profPromises);

    const classPromises = _.chunk(termDump.classes, this.CHUNK_SIZE).map(async (classChunk) => {
      const processedChunk = classChunk.map((aClass) => { return this.processClass(aClass, coveredTerms); });
      return Course.bulkCreate(processedChunk, { updateOnDuplicate: courseAttributes });
    });
    await Promise.all(classPromises);

    const secPromises = _.chunk(termDump.sections, this.CHUNK_SIZE).map(async (secChunk) => {
      const processedChunk = secChunk.map((section) => { return this.processSection(section); });
      return Section.bulkCreate(processedChunk, { updateOnDuplicate: secAttributes });
    });
    await Promise.all(secPromises);

    // destroy courses that haven't been updated in over 2 days
    if (destroy) {
      await Course.destroy({
        where: {
          termId: { [Op.in]: Array.from(coveredTerms) },
          updatedAt: { [Op.lt]: new Date(new Date() - 48 * 60 * 60 * 1000) },
        },
      });
    }
    sequelize.options.logging = true;
  }

  processClass(classInfo, coveredTerms) {
    coveredTerms.add(classInfo.termId);
    const additionalProps = { id: `${Keys.getClassHash(classInfo)}`, minCredits: Math.floor(classInfo.minCredits), maxCredits: Math.floor(classInfo.maxCredits) };
    return { ...classInfo, ...additionalProps };
  }

  processSection(secInfo) {
    const additionalProps = { id: `${Keys.getSectionHash(secInfo)}`, classHash: Keys.getClassHash(secInfo) };
    return { ...secInfo, ...additionalProps };
  }
}

const instance = new DumpProcessor();

async function fromFile(termFilePath, empFilePath) {
  const termExists = await fs.pathExists(termFilePath);
  const empExists = await fs.pathExists(empFilePath);

  if (!termExists || !empExists) {
    macros.error('need to run scrape before indexing');
    return;
  }

  const termDump = await fs.readJson(termFilePath);
  const profDump = await fs.readJson(empFilePath);
  await instance.main({ termDump, profDump });
}

if (require.main === module) {
  // If called directly, attempt to index the dump in public dir
  const termFilePath = path.join(macros.PUBLIC_DIR, 'getTermDump', 'allTerms.json');
  const empFilePath = path.join(macros.PUBLIC_DIR, 'employeeDump.json');
  fromFile(termFilePath, empFilePath).catch(macros.error);
}

export default instance;
