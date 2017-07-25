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

import path from 'path';
import fs from 'fs-promise';

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
