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

import URI from 'urijs';

import ellucianBaseParser from '../ellucianBaseParser';


it('getBaseURL', () => {
  const catagoryURL = 'https://prd-wlssb.temple.edu/prod8/bwckctlg.p_display_courses?term_in=201503&one_subj=AIRF&sel_crse_strt=2041&sel_crse_end=2041&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr=';

  const classURL = 'https://prd-wlssb.temple.edu/prod8/bwckctlg.p_disp_listcrse?term_in=201503&subj_in=AIRF&crse_in=2041&schd_in=%';

  expect(ellucianBaseParser.getBaseURL(catagoryURL)).toBe('https://prd-wlssb.temple.edu/prod8/');
  expect(ellucianBaseParser.getBaseURL(classURL)).toBe('https://prd-wlssb.temple.edu/prod8/');
});


it('createClassURL', () => {
  let url = 'https://banner.uregina.ca/prod/sct/bwckctlg.p_display_courses?sel_crse_strt=&sel_crse_end=&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr=&term_in=201620&one_subj=BUS';
  expect(ellucianBaseParser.createClassListUrl('https://banner.uregina.ca/prod/sct/bwckctlg.p_disp_course_detail', '201620', 'BUS')).toBe(url);

  url = 'https://banner.uregina.ca/prod/sct/bwckctlg.p_display_courses?sel_crse_strt=&sel_crse_end=&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr=&term_in=201620&one_subj=EC%26I';
  expect(ellucianBaseParser.createClassListUrl('https://banner.uregina.ca/prod/sct/bwckctlg.p_disp_course_detail', '201620', 'EC&I')).toBe(url);


  url = 'https://banner.uregina.ca/prod/sct/bwckctlg.p_display_courses?sel_crse_strt=&sel_crse_end=&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr=&term_in=201620&one_subj=EC%26I';
  expect(ellucianBaseParser.createClassListUrl('https://banner.uregina.ca/prod/sct/bwckctlg.p_disp_course_detail', '201620', 'EC&I')).toBe(url);
});


it('createCatalogUrl', () => {
  const url = 'https://banner.uregina.ca/prod/sct/bwckctlg.p_disp_course_detail?cat_term_in=201620&subj_code_in=EC%26I&crse_numb_in=050';

  const goalUrl = ellucianBaseParser.createCatalogUrl('https://banner.uregina.ca/prod/sct/bwckctlg.p_disp_course_detail', '201620', 'EC&I', '050');

  expect(new URI(url).equals(goalUrl)).toBe(true);
});

it('createClassURL', () => {
  const url = 'https://banner.uregina.ca/prod/sct/bwckctlg.p_disp_listcrse?schd_in=%&term_in=201620&subj_in=EC%26I&crse_in=050';
  const goalUrl = ellucianBaseParser.createClassURL('https://banner.uregina.ca/prod/sct/bwckctlg.p_disp_course_detail', '201620', 'EC&I', '050');
  expect(new URI(url).equals(goalUrl)).toBe(true);
});
