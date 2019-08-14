/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import path from 'path';
import fs from 'fs-extra';

import ellucianClassListParser from '../ellucianClassListParser';

it('should behave...', async (done) => {
  const body = await fs.readFile(path.join(__dirname, 'data', 'ellucianClassListParser', '2.html'), 'utf8');

  const catalogURL = 'https://bannerweb.upstate.edu/isis/bwckctlg.p_disp_course_detail?cat_term_in=201580&subj_code_in=MDCN&crse_numb_in=2064';


  const url = 'https://bannerweb.upstate.edu/isis/bwckctlg.p_display_courses?term_in=201580&one_subj=MDCN&sel_crse_strt=2064&sel_crse_end=2064&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr=';

  expect(true).toBe(ellucianClassListParser.supportsPage(url));

  const output = ellucianClassListParser.parse(body, url);

  expect(output.length).toBe(1);
  expect(output[0]).toBe(catalogURL);
  done();
});


it('should skip invalid urls', () => {
  const output = ellucianClassListParser.parse('<a href="hlfdjalf"></a>', 'http://google.com');

  expect(output.length).toBe(0);
});
