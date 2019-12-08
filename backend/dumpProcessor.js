/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import fs from 'fs-extra';
import _ from 'lodash';
import path from 'path';
import Keys from '../common/Keys';
import macros from './macros';
import db from './database/models/index';

const Professor = db.Professor;
const Course = db.Course;
const Section = db.Section;
const Op = db.Sequelize.Op;

const profAttributes = Object.keys(_.omit(Professor.rawAttributes, ['id', 'createdAt', 'updatedAt']));
const courseAttributes = Object.keys(_.omit(Course.rawAttributes, ['id', 'createdAt', 'updatedAt']));
const secAttributes = Object.keys(_.omit(Section.rawAttributes, ['id', 'createdAt', 'updatedAt']));

class dumpProcessor {
  constructor() {
    this.CHUNK_SIZE = 2000;
  }

  /**
   * @param {Object} termDump object containing all class and section data, normally acquired from scrapers
   * @param {Object} profDump object containing all professor data, normally acquired from scrapers
   */
  async main(termDump, profDump) {
    const coveredTerms = new Set();

    const profPromises = this.chunkify(Object.values(profDump)).map(async (profChunk) => {
      const processedChunk = profChunk.map(prof => { return this.processProf(prof); });
      return Professor.bulkCreate(processedChunk, { updateOnDuplicate: profAttributes });
    });
    await Promise.all(profPromises);

    const classPromises = this.chunkify(termDump.classes).map(async (classChunk) => {
      const processedChunk = classChunk.map(aClass => { return this.processClass(aClass, coveredTerms); });
      return Course.bulkCreate(processedChunk, { updateOnDuplicate: courseAttributes });
    });
    await Promise.all(classPromises);

    const secPromises = this.chunkify(termDump.sections).map(async (secChunk) => {
      const processedChunk = secChunk.map(section => { return this.processSection(section); });
      return Section.bulkCreate(processedChunk, { updateOnDuplicate: secAttributes });
    });
    await Promise.all(secPromises);

    await Course.destroy({
      where: { 
        termId: { [Op.in]: Array.from(coveredTerms) }, 
        updatedAt: { [Op.lt]: new Date(new Date() - 24 * 60 * 60 * 1000) } 
      },
    });
  }

  processProf(profInfo) {
    const additionalProps = { profId: profInfo.id };
    delete profInfo.id;
    return { ...profInfo, ...additionalProps };
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

  chunkify(arr) {
    const res = [];
    for (let index = 0; index < arr.length; index += this.CHUNK_SIZE) {
      res.push(arr.slice(index, index + this.CHUNK_SIZE));
    }
    return res;
  }

  async truncateTables() {
    await Professor.destroy({ where: {} });
    await Section.destroy({ where: {} });
    await Course.destroy({ where: {} });
  }
}

const instance = new dumpProcessor();

async function fromFile(termFilePath, empFilePath) {
  const termExists = await fs.pathExists(termFilePath);
  const empExists = await fs.pathExists(empFilePath);

  if (!termExists || !empExists) {
    macros.error('need to run scrape before indexing');
    return;
  }

  const termDump = await fs.readJson(termFilePath);
  const profDump = await fs.readJson(empFilePath);
  await instance.main(termDump, profDump);
}

if (require.main === module) {
  // If called directly, attempt to index the dump in public dir
  const termFilePath = path.join(macros.PUBLIC_DIR, 'getTermDump', 'allTerms.json');
  const empFilePath = path.join(macros.PUBLIC_DIR, 'employeeDump.json');
  fromFile(termFilePath, empFilePath).catch(macros.error);
}

export default instance;
