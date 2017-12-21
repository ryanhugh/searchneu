/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import testData from './testData';
import markMissingPrereqs from '../markMissingPrereqs';


it('can substitute one line', () => {
  const keyToRows = {
    'neu.edu/201770/MATH/2500': {
      subject: 'MATH',
      classId: '2500',
    },
  };

  const prereqs = {
    type: 'or',
    values: [
      'dd', {
        classId: '2500',
        subject: 'MATH',
      },
    ],
  };

  const output = markMissingPrereqs.updatePrereqs(prereqs, 'neu.edu', '201770', keyToRows);

  expect(output).toEqual({
    type: 'or',
    values: ['dd', {
      subject: 'MATH',
      classId: '2500',
    }],
  });
});

it('can insert a missing if cant find in db', () => {
  const keyToRows = {};

  const prereqs = {
    type: 'or',
    values: [{
      classId: '2500',
      subject: 'MATH',
    }],
  };

  const output = markMissingPrereqs.updatePrereqs(prereqs, 'neu.edu', '201770', keyToRows);

  expect(output).toEqual({
    type: 'or',
    values: [{
      subject: 'MATH',
      classId: '2500',
      missing: true,
    }],
  });
});


it('go should work', async (done) => {
  const termDump = await testData.loadTermDump();

  markMissingPrereqs.go(termDump);

  // Find the class that we are checking
  let matchCount = 0;
  for (const aClass of termDump.classes) {
    if (aClass.classId === '061' && aClass.subject === 'STAT') {
      matchCount++;

      expect(aClass.prereqs.values[0].classId).toBe('023');
      expect(aClass.prereqs.values.length).toBe(3);
    }
  }

  expect(matchCount).toBe(1);
  done();
});


it('can swap coreqs', async (done) => {
  const termDump = {
    classes: [{
      desc: '',
      classId: '017',
      prettyUrl: 'https://myswat.swarthmore.edu/pls/bwckctlg.p_disp_course_detail?cat_term_in=201602&subj_code_in=EDUC&crse_numb_in=017',
      name: 'Curriculum & Methods Seminar',
      url: 'https://myswat.swarthmore.edu/pls/bwckctlg.p_disp_listcrse?schd_in=%25&term_in=201602&subj_in=EDUC&crse_in=017',
      coreqs: {
        type: 'and',
        values: [
          {
            classId: '016',
            subject: 'EDUC',
          },
        ],
      },
      host: 'swarthmore.edu',
      termId: '201602',
      subject: 'EDUC',
      crns: [],
      lastUpdateTime: 1462130937867,
      deps: {},
      updatedByParent: false,
    },
    {
      desc: '',
      classId: '016',
      prettyUrl: 'https://myswat.swarthmore.edu/pls/bwckctlg.p_disp_course_detail?cat_term_in=201602&subj_code_in=EDUC&crse_numb_in=016',
      name: 'Practice Teaching',
      url: 'https://myswat.swarthmore.edu/pls/bwckctlg.p_disp_listcrse?schd_in=%25&term_in=201602&subj_in=EDUC&crse_in=016',
      coreqs: {
        type: 'and',
        values: [
          {
            classId: '017',
            subject: 'EDUC',
          },
        ],
      },
      host: 'swarthmore.edu',
      termId: '201602',
      subject: 'EDUC',
      crns: [],
      lastUpdateTime: 1462130982330,
      deps: {},
      updatedByParent: false,
    }],
    sections: [],
  };


  markMissingPrereqs.go(termDump);
  expect(termDump.classes[0].coreqs.values[0].classId).toBe('016');

  done();
});


it('can simplify', async (done) => {
  const termDump = await testData.loadTermDump();

  markMissingPrereqs.go(termDump);

  // Find the class that we are checking
  let matchCount = 0;
  for (const aClass of termDump.classes) {
    if (aClass.classId === '031' && aClass.subject === 'STAT') {
      matchCount++;

      aClass.prereqs.values.forEach((prereq) => {
        expect(prereq.subject).not.toBe(undefined);
        expect(prereq.values).toBe(undefined);
        expect(prereq.type).toBe(undefined);
      });
    }
  }

  expect(matchCount).toBe(1);
  done();
});
