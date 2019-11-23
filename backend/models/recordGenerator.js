import db from './index';
import fs from 'fs-extra';
import _ from 'lodash';
import Keys from '../../common/Keys';

const Professor = db.Professor;
const Course = db.Course;
const Section = db.Section;
const Meeting = db.Meeting;

class RecordGenerator {
  async main(termDump, profDump) {
    _.mapValues(profDump, (prof) => {
      Professor.create(profInfo);
    });

    termDump.classes.forEach(aClass => {
      await this.insertClass(aClass);
    });

    termDump.sections.forEach(section => {
      await this.insertSection(section);
    });
  }

  async insertClass(classInfo) {
    const additionalProps = { classHash: Keys.getClassHash(classInfo) };
    const course = await Course.create({ ...classInfo, ...additionalProps });
  }

  async insertSection(secInfo) {
    const additionalProps = { sectionHash: Keys.getSectionHash(secInfo), classHash: Keys.getClassHash(secInfo) };
    const section = await Section.create({ ...secInfo, ...additionalProps });
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
