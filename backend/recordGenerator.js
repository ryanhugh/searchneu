/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import fs from 'fs-extra';
import path from 'path';
import _ from 'lodash';
import Keys from '../common/Keys';
import macros from './macros';
import db from './database/models/index';

const Professor = db.Professor;
const Course = db.Course;
const Section = db.Section;

const CHUNK_SIZE = 2000;

class RecordGenerator {
  /**
   * @param {Object} termDump object containing all class and section data, normally acquired from scrapers
   * @param {Object} profDump object containing all professor data, normally acquired from scrapers
   */
  async main(termDump, profDump) {
    const profPromises = this.chunkify(Object.values(profDump)).map(async (profChunk) => {
      const processedChunk = profChunk.map(prof => { return this.processProf(prof); });
      return Professor.bulkCreate(processedChunk);
    });
    await Promise.all(profPromises);

    const classPromises = this.chunkify(termDump.classes).map(async (classChunk) => {
      const processedChunk = classChunk.map(aClass => { return this.processClass(aClass); });
      return Course.bulkCreate(processedChunk);
    });
    await Promise.all(classPromises);


    const secPromises = this.chunkify(termDump.sections).map(async (secChunk) => {
      const processedChunk = secChunk.map(section => { return this.processSection(section); });
      return Section.bulkCreate(processedChunk);
    });
    await Promise.all(secPromises);
  }

  processProf(profInfo) {
    delete profInfo.id;
    return profInfo;
  }

  processClass(classInfo) {
    const additionalProps = { id: `${Keys.getClassHash(classInfo)}`, minCredits: Math.floor(classInfo.minCredits), maxCredits: Math.floor(classInfo.maxCredits) };
    return { ...classInfo, ...additionalProps };
  }

  processSection(secInfo) {
    const additionalProps = { id: `${Keys.getSectionHash(secInfo)}`, classHash: Keys.getClassHash(secInfo) };
    return { ...secInfo, ...additionalProps };
  }

  chunkify(arr) {
    const res = [];
    for (let index = 0; index < arr.length; index += CHUNK_SIZE) {
      res.push(arr.slice(index, index + CHUNK_SIZE));
    }
    return res;
  }
}

const instance = new RecordGenerator();

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
