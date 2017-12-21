/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import testData from './testData';
import prereqClassUids from '../prereqClassUids';


it('can substitute one line', () => {
  const keyToRows = {
    'neu.edu201770MATH2500': [{
      subject: 'MATH',
      classUid: '2500_34343',
    }],
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

  const output = prereqClassUids.updatePrereqs(prereqs, 'neu.edu', '201770', keyToRows);

  expect(output).toEqual({
    type: 'or',
    values: ['dd', {
      subject: 'MATH',
      classUid: '2500_34343',
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

  const output = prereqClassUids.updatePrereqs(prereqs, 'neu.edu', '201770', keyToRows);

  expect(output).toEqual({
    type: 'or',
    values: [{
      subject: 'MATH',
      classId: '2500',
      missing: true,
    }],
  });
});


it('can replace a class with multiple matches with an "or"', () => {
  const prereqs = {
    type: 'or',
    values: [
      'dd', {
        classId: '2500',
        subject: 'MATH',
      },
    ],
  };

  const keyToRows = {
    'neu.edu201770MATH2500': [{
      subject: 'MATH',
      classUid: '2500_77777',
    }, {
      subject: 'MATH',
      classUid: '2500_1222121',
    }],
  };

  const output = prereqClassUids.updatePrereqs(prereqs, 'neu.edu', '201770', keyToRows);


  expect(output).toEqual({
    type: 'or',
    values: ['dd', {
      type: 'or',
      values: [{
        subject: 'MATH',
        classUid: '2500_77777',
      }, {
        subject: 'MATH',
        classUid: '2500_1222121',
      }],
    }],
  });
});


it('go should work', async (done) => {
  const termDump = await testData.loadTermDump();

  prereqClassUids.go(termDump);

  // Find the class that we are checking
  let matchCount = 0;
  for (const aClass of termDump.classes) {
    if (aClass.classUid === '061_1925216900' && aClass.subject === 'STAT') {
      matchCount++;

      expect(aClass.prereqs.values[0].classUid).toBe('023_1049977931');
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
      classUid: '017_1314190396',
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
      classUid: '016_1711862930',
    }],
    sections: [],
  };


  prereqClassUids.go(termDump);
  expect(termDump.classes[0].coreqs.values[0].classUid).toBe('016_1711862930');

  done();
});


it('can simplify', async (done) => {
  const termDump = await testData.loadTermDump();

  prereqClassUids.go(termDump);

  // Find the class that we are checking
  let matchCount = 0;
  for (const aClass of termDump.classes) {
    if (aClass.classUid === '031_487876058') {
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
