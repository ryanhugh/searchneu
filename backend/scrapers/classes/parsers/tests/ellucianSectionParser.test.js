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

import request from '../../../request';

var ellucianSectionParser = require('../ellucianSectionParser')


it('parse prereqs and coreqs and seat data from 1.html', async function (done) {

  //the pre and co requs html here has been modified
  //this contains the same pre requs as prereqs10
  const body = await fs.readFile(path.join(__dirname, 'data', 'ellucianSectionParser', '1.html'), 'utf8');

  var url = 'https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201610&crn_in=15633';

  expect(ellucianSectionParser.supportsPage(url)).toBe(true);

  const retVal = ellucianSectionParser.parse(body, url);

  expect(retVal).toMatchSnapshot()

  done()
});




it('honors works', async function (done) {

  const body = await fs.readFile(path.join(__dirname, 'data', 'ellucianSectionParser', 'honors.html'), 'utf8')

  var url = 'https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201610&crn_in=15633';

  expect(ellucianSectionParser.supportsPage(url)).toBe(true);

  let retVal = ellucianSectionParser.parse(body, url);

  expect(retVal).toMatchSnapshot();

  done()
});
