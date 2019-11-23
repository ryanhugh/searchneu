import db from './index';
import fs from 'fs-extra';
import _ from 'lodash';

const Professor = db.Professor;
const Course = db.Course;
const Section = db.Section;
const Meeting = db.Meeting;

class RecordGenerator {
    async main(termDump, profDump) {
        _.mapValues(profDump, (prof) => {
            this.insertProf(prof);
        });
        termDump.classes.forEach(aClass => {
            this.insertClass(aClass);
        });
    }

    async insertProf(profInfo) {
        const prof = await Professor.create(profInfo);
    }

    async insertClass(classInfo) {
        const course = await Course.create(classInfo);
        classInfo.sections.forEach(section => {
            this.insertSection(course, section);
        });
    }

    async insertSection(course, secInfo) {
        secInfo.classId = course.id;
        const section = await Section.create(secInfo);
        
        section.meetings.forEach(meeting => {
            this.insertMeeting(section, meeting);
        });
    }

    async insertMeeting(section, meetingInfo) {
        meetingInfo.sectionId = section.id;
        const meeting = await Meeting.create(meetingInfo);
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