/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import path from 'path';
import MockDate from 'mockdate';
import fs from 'fs-extra';

import ellucianClassParser from '../ellucianClassParser';


beforeAll(() => {
  MockDate.set('Mon Oct 10 2016 00:00:00 -0000', -3000);
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

  const aClass = output.classWrapper.value;

  expect(aClass).toEqual({
    classAttributes: [], crns: ['15633', '15636', '15639', '16102', '17799', '17800'],
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

  const aClass = output.classWrapper.value;

  expect(ellucianClassParser.supportsPage(url)).toBe(true);

  expect(aClass).toEqual({
    classAttributes: [],
    crns: [
      '24600',
      '24601',
      '24603',
      '25363',
    ],
  });

  done();
});

it('should parse a bunch of crns', async (done) => {
  const body = await fs.readFile(path.join(__dirname, 'data', 'ellucianClassParser', '3.html'), 'utf8');
  //set up variables
  const url = 'https://prd-wlssb.temple.edu/prod8/bwckctlg.p_disp_listcrse?term_in=201503&subj_in=ACCT&crse_in=2102&schd_in=BAS';


  //main parse
  const output = ellucianClassParser.parse(body, url);

  const aClass = output.classWrapper.value;

  expect(ellucianClassParser.supportsPage(url)).toBe(true);

  expect(aClass).toEqual({
    classAttributes: [], crns: ['11018', '11019', '11020', '11679', '19962', '20800', '22497', '23294', '23295', '24435', '6073', '6074', '6075', '6077', '6129', '6130', '8145'],
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

  const aClass = output.classWrapper.value;

  expect(ellucianClassParser.supportsPage(url)).toBe(true);

  expect(aClass).toEqual({
    classAttributes: [],
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

  const aClass = output.classWrapper.value;

  expect(ellucianClassParser.supportsPage(url)).toBe(true);

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
  expect(output.classWrapper).toMatchSnapshot();

  done();
});
