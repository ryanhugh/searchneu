/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import addClassUids from '../addClassUids';


it('should work', () => {
  expect(addClassUids.getClassUid('001A', 'Int:Gender & Sexuality-attach')).toBe('001A_446579316');
});


it('addClassUids should work 2', () => {
  const termDump = {
    classes: [{
      desc: '',
      classId: '001A',
      prettyUrl: 'https://myswat.swarthmore.edu/pls/bwckctlg.p_disp_course_detail?cat_term_in=201602&subj_code_in=GSST&crse_numb_in=001A',
      name: 'Int:Gender & Sexuality-attach',
      url: 'https://myswat.swarthmore.edu/pls/bwckctlg.p_disp_listcrse?schd_in=%25&term_in=201602&subj_in=GSST&crse_in=001A',
      host: 'swarthmore.edu',
      termId: '201602',
      subject: 'GSST',
      crns: [],
      lastUpdateTime: 1462130838758,
      deps: {},
      updatedByParent: false,
    }],
    sections: [],
  };


  addClassUids.go(termDump);
  expect(termDump.classes[0].classUid).toBe('001A_446579316');
});
