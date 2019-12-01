/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import recordGenerator from '../recordGenerator';
import db from '../database/models/index';

const Professor = db.Professor;
const Course    = db.Course;
const Section   = db.Section;

beforeAll(async () => {
  await Professor.truncate({ cascade: true, restartIdentity: true });
  await Course.truncate({ cascade: true, restartIdentitiy: true });
  await Section.truncate({ cascade: true, restartIdentity: true });
});


afterAll(async () => {
  await db.sequelize.close();
});

const insertFundies = async () => {
  const courseInfo = {
    crns: [],
    classAttributes: [ 'Computer&Info Sci' ],
    desc:
   'Accompanies CS 2500. Covers topics from the course through various experiments. 1.000 Lab hours',
    classId: '2501',
    prettyUrl:
   'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201960&subj_code_in=CS&crse_numb_in=2501',
    name: 'Lab for CS 2500',
    url:
   'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=201960&subj_in=CS&crse_in=2501&schd_in=%',
    lastUpdateTime: 1569285152276,
    scheduleType: 'Lab',
    maxCredits: 1,
    minCredits: 1,
    coreqs: { type: 'and', values: [ { classId: '2500', subject: 'CS' } ] },
    termId: '201960',
    host: 'neu.edu',
    subject: 'CS',
    optPrereqsFor: { values: [] },
    prereqsFor: { values: [] },
    sections: [], 
  };

  await recordGenerator.insertClass(courseInfo);
};

it('generates a proper professor record from an employee JSON', async () => {
  const beforeCount = await Professor.count();
  const profInfo = {
    name: 'Henry Armitage',
    firstName: 'Henry',
    lastName: 'Armitage',
    id: 'spookyscaryskeletons',
    phone: '1234567890',
    emails: ['h.armitage@mistkatonic.edu'],
    primaryRole: 'Chief Librarian',
    primaryDepartment: 'Not Computer Science',
    link: 'https://google.com',
  };

  await recordGenerator.insertProf(profInfo);
  expect(await Professor.count()).toEqual(beforeCount + 1);
});

it('generates a proper course record from a class JSON', async () => {
  const beforeCount = await Course.count();
  await insertFundies();
  expect(await Course.count()).toEqual(beforeCount + 1);
});

describe('with classes generated', () => {
  beforeEach(async () => {
    await Course.truncate({ cascade: true, restartIdentity: true });
    await insertFundies();
  });

  it('generates a proper section record from a section JSON', async () => {
    const beforeCount = await Section.count();
    const sectionInfo = {
      seatsCapacity: 55,
      seatsRemaining: 3,
      waitCapacity: 0,
      waitRemaining: 0,
      online: false,
      honors: false,
      url: 'https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201930&crn_in=34710',
      crn: '34710',
      meetings: [ 
        { 
          startDate: 17903,
          endDate: 18003,
          profs: [ 'Rebecca Wilks MacKenzie' ],
          where: 'West Village H 210',
          type: 'Class',
          times: { '5': [ { start: 48900, end: 54900 } ] },
          allProfs: [ 'Rebecca Wilks MacKenzie' ] 
        } 
      ],
      lastUpdateTime: 1569285446029,
      termId: '201960',
      host: 'neu.edu',
      subject: 'CS',
      classId: '2501',
    };
    
    await recordGenerator.insertSection(sectionInfo);
    expect(await Section.count()).toEqual(beforeCount + 1);
  });
});
