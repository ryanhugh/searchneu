import fs from 'fs-extra';
import path from 'path';
import Keys from '../common/Keys';
import macros from './macros';
import db from './database/models/index';

const Professor = db.Professor;
const Course = db.Course;
const Section = db.Section;

class RecordGenerator {
  async main(termDump, profDump) {
    // _.mapValues(profDump, async (prof) => {
    //   await this.insertProf(prof);
    // });

    termDump.classes.forEach(async (aClass) => {
      const res = await this.insertClass(aClass);
    });

    termDump.sections.forEach(async (section) => {
      await this.insertSection(section);
    });
  }

  async insertProf(profInfo) {
    delete profInfo.id;
    await Professor.create(profInfo);
  }

  async insertClass(classInfo) {
    const additionalProps = { id: Keys.getClassHash(classInfo), minCredits: Math.floor(classInfo.minCredits), maxCredits: Math.floor(classInfo.maxCredits) };
    const val = await Course.create({ ...classInfo, ...additionalProps });
  }

  async insertSection(secInfo) {
    const additionalProps = { id: Keys.getSectionHash(secInfo), classHash: Keys.getClassHash(secInfo) };
    Section.create({ ...secInfo, ...additionalProps });
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
  instance.main(termDump, profDump);
}

if (require.main === module) {
  // If called directly, attempt to index the dump in public dir
  const termFilePath = path.join(macros.PUBLIC_DIR, 'getTermDump', 'allTerms.json');
  const empFilePath = path.join(macros.PUBLIC_DIR, 'employeeDump.json');
  fromFile(termFilePath, empFilePath).catch(macros.error);
}

export default instance;
