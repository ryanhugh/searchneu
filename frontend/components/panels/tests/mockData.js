/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */


import Class from '../../classModels/Class';
import Section from '../../classModels/Section';


// Contains a couple instances of classes
// Used for testing files in the frontend
// Feel free to add more or modify existing ones, as long as the existing tests don't break.

const cs0210 = Class.create({
  lastUpdateTime: 1511131673768,
  name: 'Introduction to Search',
  url: 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=201810&subj_in=CS&crse_in=0210&schd_in=%',
  crns: ['19389'],
  honors: false,
  maxCredits: 49,

  // These arn't the actuall prereqs or coreqs for this class
  prereqs:
        {
          type: 'and',
          values: [
            {
              type: 'or',
              values: [
                {
                  subject: 'CHEM',
                  classId: '2313',
                },
                {
                  subject: 'CHEM',
                  classId: '2317',
                }],
            },
            {
              type: 'or',
              values: [
                {
                  subject: 'CHEM',
                  classId: '2321',
                },
                {
                  subject: 'CHEM',
                  classId: '2331',
                }],
            },
            {
              type: 'or',
              values: [
                {
                  subject: 'CHEM',
                  classId: '3401',
                },
                {
                  classId: '3421',
                  subject: 'CHEM',
                  missing: true,
                },
                {
                  subject: 'CHEM',
                  classId: '3431',
                }],
            }],
        },
  coreqs:
        {
          type: 'and',
          values: [
            {
              subject: 'CHEM',
              classId: '3506',
            },
            {
              subject: 'CHEM',
              classId: '3507',
            }],
        },
  minCredits: 1,
  desc: 'Offers students an opportunity to learn and practice how to search in large amounts of unstructured data. Covers basic concepts in search, retrieval models, indexing, querying and ranking, and evaluation. This is a limited engagement course. 1.800 Continuing Education Units 1.800 Lecture hours',
  classId: '0210',
  prettyUrl: 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201810&subj_code_in=CS&crse_numb_in=0210',
  termId: '201810',
  host: 'neu.edu',
  subject: 'CS',
});


const sectionsForcs0210 = [
  {
    seatsCapacity: 25,
    seatsRemaining: 0,
    waitCapacity: 50,
    waitRemaining: 2,
    online: false,
    url: 'https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201810&crn_in=19389',
    crn: '19389',
    profs: ['TBA'],
    meetings: [
      {
        startDate: 17474,
        endDate: 17474,
        where: 'TBA',
        type: 'Class',
        times:
          {
            6: [
              {
                start: 32400,
                end: 43200,
              }],
          },
      },
      {
        startDate: 17477,
        endDate: 17477,
        where: 'TBA',
        type: 'Class',
        times:
          {
            2: [
              {
                start: 64800,
                end: 75600,
              }],
          },
      },
      {
        startDate: 17500,
        endDate: 17500,
        where: 'TBA',
        type: 'Class',
        times:
          {
            4: [
              {
                start: 64800,
                end: 75600,
              }],
          },
      },
      {
        startDate: 17502,
        endDate: 17502,
        where: 'TBA',
        type: 'Class',
        times:
          {
            6: [
              {
                start: 32400,
                end: 43200,
              }],
          },
      },
      {
        startDate: 17507,
        endDate: 17507,
        where: 'TBA',
        type: 'Class',
        times:
          {
            4: [
              {
                start: 64800,
                end: 75600,
              }],
          },
      },
      {
        startDate: 17509,
        endDate: 17509,
        where: 'TBA',
        type: 'Class',
        times:
          {
            6: [
              {
                start: 32400,
                end: 43200,
              }],
          },
      }],
    lastUpdateTime: 1511131913601,
    termId: '201810',
    host: 'neu.edu',
    subject: 'CS',
    classId: '0210',
  }];

cs0210.loadSectionsFromServerList(sectionsForcs0210);


const cs1210 = Class.create({
  lastUpdateTime: 1511131674191,
  name: 'Computer Science/Information Science Overview 2: Co-op Preparation',
  url: 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=201810&subj_in=CS&crse_in=1210&schd_in=%',
  crns: ['13502', '13503', '14386', '14404', '14405'],
  honors: false,
  maxCredits: 1,
  minCredits: 1,
  desc: 'Continues the preparation of students for careers in the computing and information fields by discussing co-op and co-op processes. Offers students an opportunity to prepare a professional résumé; practice proper interviewing techniques; explore current job opportunities; learn how to engage in the job and referral process; and to understand co-op policies, procedures, and expectations. Discusses professional behavior and ethical issues in the workplace. 1.000 Lecture hours',
  classId: '1210',
  prettyUrl: 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201810&subj_code_in=CS&crse_numb_in=1210',
  termId: '201810',
  host: 'neu.edu',
  subject: 'CS',
});

const sectionsForcs1210 = [{
  seatsCapacity: 19,
  seatsRemaining: 0,
  waitCapacity: 0,
  waitRemaining: 0,
  online: false,
  url: 'https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201810&crn_in=13502',
  crn: '13502',
  profs: ['Jennifer Anne Shire'],
  meetings: [
    {
      startDate: 17415,
      endDate: 17506,
      where: 'Snell Engineering Center 108',
      type: 'Class',
      times:
        {
          2: [
            {
              start: 35400,
              end: 41400,
            }],
        },
    }],
  lastUpdateTime: 1511131914029,
  termId: '201810',
  host: 'neu.edu',
  subject: 'CS',
  classId: '1210',
},
{
  seatsCapacity: 19,
  seatsRemaining: 6,
  waitCapacity: 0,
  waitRemaining: 0,
  online: false,
  url: 'https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201810&crn_in=13503',
  crn: '13503',
  profs: ['Melissa Anne Irgens Peikin'],
  meetings: [
    {
      startDate: 17415,
      endDate: 17506,
      where: 'Churchill Hall 103',
      type: 'Class',
      times:
        {
          2: [
            {
              start: 35400,
              end: 41400,
            }],
        },
    }],
  lastUpdateTime: 1511131914063,
  termId: '201810',
  host: 'neu.edu',
  subject: 'CS',
  classId: '1210',
},
{
  seatsCapacity: 19,
  seatsRemaining: 0,
  waitCapacity: 0,
  waitRemaining: 0,
  online: false,
  url: 'https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201810&crn_in=14386',
  crn: '14386',
  profs: ['Yasmil Montes'],
  meetings: [
    {
      startDate: 17415,
      endDate: 17506,
      where: 'Ryder Hall 293',
      type: 'Class',
      times:
        {
          2: [
            {
              start: 42300,
              end: 48300,
            }],
        },
    }],
  lastUpdateTime: 1511131914075,
  termId: '201810',
  host: 'neu.edu',
  subject: 'CS',
  classId: '1210',
},
{
  seatsCapacity: 19,
  seatsRemaining: 0,
  waitCapacity: 0,
  waitRemaining: 0,
  online: false,
  url: 'https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201810&crn_in=14404',
  crn: '14404',
  profs: ['Jennifer Anne Shire'],
  meetings: [
    {
      startDate: 17415,
      endDate: 17506,
      where: 'Ryder Hall 431',
      type: 'Class',
      times:
        {
          2: [
            {
              start: 42300,
              end: 48300,
            }],
        },
    }],
  lastUpdateTime: 1511131914065,
  termId: '201810',
  host: 'neu.edu',
  subject: 'CS',
  classId: '1210',
},
{

  seatsCapacity: 19,
  seatsRemaining: 0,
  waitCapacity: 0,
  waitRemaining: 0,
  online: false,
  url: 'https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201810&crn_in=14404',
  crn: '14405',
  profs: ['Jennifer Anne Shire'],
  meetings: [
    {
      startDate: 17415,
      endDate: 17506,
      where: 'Ryder Hall 431',
      type: 'Class',
      times:
        {
          2: [
            {
              start: 42300,
              end: 48300,
            }],
        },
    }],
  lastUpdateTime: 1511131914065,
  termId: '201810',
  host: 'neu.edu',
  subject: 'CS',
  classId: '1210',

}];


cs1210.loadSectionsFromServerList(sectionsForcs1210);


const WMNS4520section = Section.create({
  seatsCapacity: 5,
  seatsRemaining: 0,
  waitCapacity: 0,
  waitRemaining: 0,
  online: false,
  url: 'https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201810&crn_in=17445',
  crn: '17445',
  profs: ['Christopher S. Chambers'],
  meetings: [
    {
      startDate: 17415,
      endDate: 17506,
      where: 'Richards Hall 235',
      type: 'Class',
      times:
        {
          2: [
            {
              start: 48900,
              end: 54900,
            },
          ],
          5: [
            {
              start: 48900,
              end: 54900,
            },
          ],
        },
    },
    {
      startDate: 17508,
      endDate: 17508,
      where: 'Kariotis Hall 102',
      type: 'Final Exam',
      times:
        {
          5: [
            {
              start: 28800,
              end: 36000,
            },
          ],
        },
    },
  ],
  lastUpdateTime: 1510778472444,
  termId: '201810',
  host: 'neu.edu',
  subject: 'WMNS',
  classId: '4520',
});


const razzaq = {
  name: 'Leena Razzaq',
  firstName: 'Leena',
  lastName: 'Razzaq',
  id: '001130930',
  phone: '6173735797',
  emails: ['l.razzaq@northeastern.edu', 'lrazzaq@ccs.neu.edu'],
  primaryRole: 'Assistant Teaching Professor',
  primaryDepartment: 'CCIS',
  url: 'https://www.ccis.northeastern.edu/people/leena-razzaq/',
  officeRoom: '132C Nightingale Hall',
  officeStreetAddress: '105-107 Forsyth Street',
  personalSite: 'http://www.ccs.neu.edu/home/lrazzaq/',
  bigPictureUrl: 'https://www.ccis.northeastern.edu/wp-content/uploads/2016/02/Leena-Razzaq-hero-image.jpg',
};


const cs9999 = Class.create({
  lastUpdateTime: 1511131674191,
  name: 'Some class that has error prereqs',
  url: 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=201810&subj_in=CS&crse_in=1210&schd_in=%',
  crns: [],
  honors: false,
  maxCredits: 1,
  minCredits: 1,
  desc: 'once apon a time there was a magician who went to fillory',
  classId: '1210',
  prettyUrl: 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201810&subj_code_in=CS&crse_numb_in=1210',
  termId: '201810',
  host: 'neu.edu',
  subject: 'CS',
  prereqs: {
    type: 'or',
    values: [
      'Error while parsing prerequisites.',
    ],
  },
});


export default {
  cs0210: cs0210,
  cs1210: cs1210,
  razzaq: razzaq,
  WMNS4520section: WMNS4520section,
  cs9999: cs9999,
};
