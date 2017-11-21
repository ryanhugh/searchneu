/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */


import Class from '../../../../common/classModels/Class';


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
                  classUid: '2313_853783103',
                  classId: '2313',
                },
                {
                  subject: 'CHEM',
                  classUid: '2317_1058823308',
                  classId: '2317',
                }],
            },
            {
              type: 'or',
              values: [
                {
                  subject: 'CHEM',
                  classUid: '2321_865155588',
                  classId: '2321',
                },
                {
                  subject: 'CHEM',
                  classUid: '2331_2069949756',
                  classId: '2331',
                }],
            },
            {
              type: 'or',
              values: [
                {
                  subject: 'CHEM',
                  classUid: '3401_1581191390',
                  classId: '3401',
                },
                {
                  classId: '3421',
                  subject: 'CHEM',
                  missing: true,
                },
                {
                  subject: 'CHEM',
                  classUid: '3431_219254629',
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
              classUid: '3506_238525520',
              classId: '3506',
            },
            {
              subject: 'CHEM',
              classUid: '3507_516122019',
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
  classUid: '0210_1437780647',
});


const sectionsForcs0210 = [
  {
    seatsCapacity: 25,
    seatsRemaining: 25,
    waitCapacity: 0,
    waitRemaining: 0,
    online: false,
    url: 'https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201810&crn_in=19389',
    crn: '19389',
    meetings: [
      {
        startDate: 17474,
        endDate: 17474,
        profs: ['TBA'],
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
        allProfs: ['TBA'],
      },
      {
        startDate: 17477,
        endDate: 17477,
        profs: ['TBA'],
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
        allProfs: ['TBA'],
      },
      {
        startDate: 17500,
        endDate: 17500,
        profs: ['TBA'],
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
        allProfs: ['TBA'],
      },
      {
        startDate: 17502,
        endDate: 17502,
        profs: ['TBA'],
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
        allProfs: ['TBA'],
      },
      {
        startDate: 17507,
        endDate: 17507,
        profs: ['TBA'],
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
        allProfs: ['TBA'],
      },
      {
        startDate: 17509,
        endDate: 17509,
        profs: ['TBA'],
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
        allProfs: ['TBA'],
      }],
    lastUpdateTime: 1511131913601,
    termId: '201810',
    host: 'neu.edu',
    subject: 'CS',
    classId: '0210',
    classUid: '0210_1437780647',
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
  classUid: '1210_602555960',
});

const sectionsForcs1210 =
[{
  seatsCapacity: 19,
  seatsRemaining: 0,
  waitCapacity: 0,
  waitRemaining: 0,
  online: false,
  url: 'https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201810&crn_in=13502',
  crn: '13502',
  meetings: [
    {
      startDate: 17415,
      endDate: 17506,
      profs: ['Jennifer Anne Shire'],
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
      allProfs: ['Jennifer Anne Shire'],
    }],
  lastUpdateTime: 1511131914029,
  termId: '201810',
  host: 'neu.edu',
  subject: 'CS',
  classId: '1210',
  classUid: '1210_602555960',
},
{
  seatsCapacity: 19,
  seatsRemaining: 6,
  waitCapacity: 0,
  waitRemaining: 0,
  online: false,
  url: 'https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201810&crn_in=13503',
  crn: '13503',
  meetings: [
    {
      startDate: 17415,
      endDate: 17506,
      profs: ['Melissa Anne Irgens Peikin'],
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
      allProfs: ['Melissa Anne Irgens Peikin'],
    }],
  lastUpdateTime: 1511131914063,
  termId: '201810',
  host: 'neu.edu',
  subject: 'CS',
  classId: '1210',
  classUid: '1210_602555960',
},
{
  seatsCapacity: 19,
  seatsRemaining: 0,
  waitCapacity: 0,
  waitRemaining: 0,
  online: false,
  url: 'https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201810&crn_in=14386',
  crn: '14386',
  meetings: [
    {
      startDate: 17415,
      endDate: 17506,
      profs: ['Yasmil Montes'],
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
      allProfs: ['Yasmil Montes'],
    }],
  lastUpdateTime: 1511131914075,
  termId: '201810',
  host: 'neu.edu',
  subject: 'CS',
  classId: '1210',
  classUid: '1210_602555960',
},
{
  seatsCapacity: 19,
  seatsRemaining: 0,
  waitCapacity: 0,
  waitRemaining: 0,
  online: false,
  url: 'https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201810&crn_in=14404',
  crn: '14404',
  meetings: [
    {
      startDate: 17415,
      endDate: 17506,
      profs: ['Jennifer Anne Shire'],
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
      allProfs: ['Jennifer Anne Shire'],
    }],
  lastUpdateTime: 1511131914065,
  termId: '201810',
  host: 'neu.edu',
  subject: 'CS',
  classId: '1210',
  classUid: '1210_602555960',
},
{

  seatsCapacity: 19,
  seatsRemaining: 0,
  waitCapacity: 0,
  waitRemaining: 0,
  online: false,
  url: 'https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201810&crn_in=14404',
  crn: '14405',
  meetings: [
    {
      startDate: 17415,
      endDate: 17506,
      profs: ['Jennifer Anne Shire'],
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
      allProfs: ['Jennifer Anne Shire'],
    }],
  lastUpdateTime: 1511131914065,
  termId: '201810',
  host: 'neu.edu',
  subject: 'CS',
  classId: '1210',
  classUid: '1210_602555960',

}];


cs1210.loadSectionsFromServerList(sectionsForcs1210);


export default {
  cs0210: cs0210,
  cs1210: cs1210,
};
