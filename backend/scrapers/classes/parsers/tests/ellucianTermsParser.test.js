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
import MockDate from 'mockdate';
import fs from 'fs-promise';

import ellucianTermsParser from '../ellucianTermsParser';


beforeAll(() => {
  MockDate.set('Mon Oct 10 2016 00:00:00 -0000')
});

afterAll(() => {
  MockDate.reset();
});


it('has a name', () => {
  //make sure a name is defined
  expect(ellucianTermsParser.name);
});

it('isValidTerm should work', () => {
  expect(ellucianTermsParser.isValidTerm('201630', 'blah blah 2016')).toBe(true);
  expect(ellucianTermsParser.isValidTerm('201630', 'blah blah 2017')).toBe(true);
  expect(ellucianTermsParser.isValidTerm('201630', 'blah blah')).toBe(true);
  expect(ellucianTermsParser.isValidTerm('2016', 'blah blah')).toBe(true);
  expect(ellucianTermsParser.isValidTerm('201', 'blah blah')).toBe(false);
});

it('should behave...', async (done) => {
  const body = await fs.readFile(path.join(__dirname, 'data', 'ellucianTermsParser', '1.html'), 'utf8');

  const url = 'https://bannerweb.upstate.edu/isis/bwckschd.p_disp_dyn_sched';
  expect(true).toBe(ellucianTermsParser.supportsPage(url));

  expect(ellucianTermsParser.parse(body, url)).toMatchSnapshot();

  done();
});


it('hi there 2', async (done) => {
  const body = await fs.readFile(path.join(__dirname, 'data', 'ellucianTermsParser', '2.html'), 'utf8');

  const url = 'https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_dyn_sched';

  const output = ellucianTermsParser.parse(body, url);

  expect(true).toBe(ellucianTermsParser.supportsPage(url));

  expect(output.terms.length).toBe(17);

  done();
});

