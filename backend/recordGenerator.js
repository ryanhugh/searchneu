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

class RecordGenerator {
  /**
   * @param {Object} termDump object containing all class and section data, normally acquired from scrapers
   * @param {Object} profDump object containing all professor data, normally acquired from scrapers
   */
  async main(termDump, profDump) {
    const profPromises = _.mapValues(profDump, async (prof) => {
      return this.insertProf(prof);
    });

    const classPromises = await termDump.classes.map(async (aClass) => {
      return this.insertClass(aClass);
    });

    const secPromises = termDump.sections.map(async (section) => {
      return this.insertSection(section);
    });

    await Promise.all(profPromises);
    await Promise.all(classPromises);
    await Promise.all(secPromises);
  }

  async insertProf(profInfo) {
    delete profInfo.id;
    return Professor.create(profInfo);
  }

  async insertClass(classInfo) {
    const additionalProps = { id: Keys.getClassHash(classInfo), minCredits: Math.floor(classInfo.minCredits), maxCredits: Math.floor(classInfo.maxCredits) };
    return Course.create({ ...classInfo, ...additionalProps });
  }

  async insertSection(secInfo) {
    const additionalProps = { id: Keys.getSectionHash(secInfo), classHash: Keys.getClassHash(secInfo) };
    return Section.create({ ...secInfo, ...additionalProps });
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
