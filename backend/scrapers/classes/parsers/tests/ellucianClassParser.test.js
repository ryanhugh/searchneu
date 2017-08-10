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

import ellucianClassParser from '../ellucianClassParser';


beforeAll(() => {
  MockDate.set('Mon Oct 10 2016 00:00:00 -0000')
});

afterAll(() => {
  MockDate.reset();
});


it('can parse crns', async (done) => {
  const body = await fs.readFile(path.join(__dirname, 'data', 'ellucianClassParser', '1.html'), 'utf8');

  //set up variables
  const url = 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=201610&subj_in=EECE&crse_in=2160&schd_in=LEC';

  //main parse
  const output = ellucianClassParser.parse(body, url);

  expect(ellucianClassParser.supportsPage(url)).toBe(true);

  const theClassKey = Object.keys(output.classWrappersMap);

  expect(theClassKey.length).toBe(1);

  const aClass = output.classWrappersMap[theClassKey].value;

  expect(aClass).toEqual({
    url: url,
    lastUpdateTime: 1476057600000,
    name: 'Embedded Design Enabling Robotics',
    crns: ['15633', '15636', '15639', '16102', '17799', '17800'],
  });

  done();
});

it('should parse a bunch of deps', async (done) => {
  //sections have different names
  const body = await fs.readFile(path.join(__dirname, 'data', 'ellucianClassParser', 'multiname.html'), 'utf8');

  //set up variables -- ellucianClassParser url might not be correct
  const url = 'https://myswat.swarthmore.edu/pls/bwckctlg.p_disp_listcrse?term_in=201502&subj_in=PHYS&crse_in=013&schd_in=LE';

  //main parse
  const output = ellucianClassParser.parse(body, url);
  expect(output).toMatchSnapshot();


  const theClassKey = Object.keys(output.classWrappersMap)[0];
  const aClass = output.classWrappersMap[theClassKey].value;

  expect(ellucianClassParser.supportsPage(url)).toBe(true);


  expect(aClass).toEqual({
    url: url,
    lastUpdateTime: 1476057600000,
    name: 'Thermodynamic/ Mech',
    crns: ['24600'],
  });

  done();
});

it('should parse a bunch of crns', async (done) => {
  const body = await fs.readFile(path.join(__dirname, 'data', 'ellucianClassParser', '3.html'), 'utf8');
  //set up variables
  const url = 'https://prd-wlssb.temple.edu/prod8/bwckctlg.p_disp_listcrse?term_in=201503&subj_in=ACCT&crse_in=2102&schd_in=BAS';


  //main parse
  const output = ellucianClassParser.parse(body, url);

  const theClassKey = Object.keys(output.classWrappersMap)[0];
  const aClass = output.classWrappersMap[theClassKey].value;

  expect(ellucianClassParser.supportsPage(url)).toBe(true);

  expect(aClass).toEqual({
    url: url,
    lastUpdateTime: 1476057600000,
    name: 'Managerial Accounting',
    crns: ['11018', '11019', '11020', '11679', '19962', '20800', '22497', '23294', '23295', '24435', '6073', '6074', '6075', '6077', '6129', '6130', '8145'],
  });

  expect(output).toMatchSnapshot();

  done();
});


it('should parse a bunch of meetings', async (done) => {
  //lots of different meetings
  const body = await fs.readFile(path.join(__dirname, 'data', 'ellucianClassParser', '4.html'), 'utf8');

  //set up variables
  const url = 'https://prd-wlssb.temple.edu/prod8/bwckctlg.p_disp_listcrse?term_in=201503&subj_in=AIRF&crse_in=2041&schd_in=BAS';

  //main parse
  const output = ellucianClassParser.parse(body, url);

  const theClassKey = Object.keys(output.classWrappersMap)[0];
  const aClass = output.classWrappersMap[theClassKey].value;

  expect(ellucianClassParser.supportsPage(url)).toBe(true);

  expect(aClass).toEqual({
    url: url,
    lastUpdateTime: 1476057600000,
    name: 'The Evolution of U.S. Aerospace Power II',
    crns: ['12090'],
  });

  expect(output).toMatchSnapshot();

  done();
});

it('can parse CANCELLED', async (done) => {
  //cancelled - something was weird with ellucianClassParser one not sure what it was
  const body = await fs.readFile(path.join(__dirname, 'data', 'ellucianClassParser', '6.html'), 'utf8');

  //set up variables
  const url = 'https://ssb.ccsu.edu/pls/ssb_cPROD/bwckctlg.p_disp_listcrse?term_in=201610&subj_in=ANTH&crse_in=245&schd_in=LE';

  //main parse
  const output = ellucianClassParser.parse(body, url);

  const theClassKey = Object.keys(output.classWrappersMap)[0];
  const aClass = output.classWrappersMap[theClassKey].value;

  expect(ellucianClassParser.supportsPage(url)).toBe(true);

  expect(aClass.url).toBe(url);
  expect(aClass.name).toBe('CANCELLED');
  expect(aClass.crns.length).toBe(1);
  expect(aClass.crns[0]).toBe('12291');

  done();
});


//make sure ellucianClassParser.classNameTranslation works
it('name translation works', async (done) => {
  const body = await fs.readFile(path.join(__dirname, 'data', 'ellucianClassParser', 'rename.html'), 'utf8');

  //set up variables
  const url = 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=201610&subj_in=CS&crse_in=2500&schd_in=LEC';

  //main parse
  const output = ellucianClassParser.parse(body, url);

  // Five sections of fundies, and 1 alt class (hon, which has 1 section).
  expect(output.classWrappersMap).toMatchSnapshot();

  done();
});
