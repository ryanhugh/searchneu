/*
 * Copyright (c) 2017 Ryan Hughes
 *
 * This file is part of CoursePro.
 *
 * CoursePro is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License
 * version 3 as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

 const addClassUids = require('../addClassUids');


 it('should work', () => {
   expect(addClassUids.getClassUid('001A', 'Int:Gender & Sexuality-attach')).toBe('001A_446579316');
 });


 it('addClassUids should work 2', () => {

   const termDump = {
     classes: [{
       _id: '57265896d4a30537f91392aa',
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
     sections: []
   };


   addClassUids.go(termDump);
   expect(termDump.classes[0].classUid).toBe('001A_446579316');
 });
