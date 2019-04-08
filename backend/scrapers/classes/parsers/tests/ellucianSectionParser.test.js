/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import path from 'path';
import fs from 'fs-extra';

import ellucianSectionParser from '../ellucianSectionParser';


it('parse prereqs and coreqs and seat data from 1.html', async (done) => {
  //the pre and co requs html here has been modified
  //this contains the same pre requs as prereqs10
  const body = await fs.readFile(path.join(__dirname, 'data', 'ellucianSectionParser', '1.html'), 'utf8');

  const url = 'https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201610&crn_in=15633';

  expect(ellucianSectionParser.supportsPage(url)).toBe(true);

  const retVal = ellucianSectionParser.parse(body, url);

  expect(retVal).toMatchSnapshot();

  done();
});


it('honors works', async (done) => {
  const body = await fs.readFile(path.join(__dirname, 'data', 'ellucianSectionParser', 'honors.html'), 'utf8');

  const url = 'https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201610&crn_in=15633';

  expect(ellucianSectionParser.supportsPage(url)).toBe(true);

  const retVal = ellucianSectionParser.parse(body, url);

  expect(retVal).toMatchSnapshot();

  done();
});


it('optional fees?', async (done) => {
  const body = await fs.readFile(path.join(__dirname, 'data', 'ellucianSectionParser', 'fees.html'), 'utf8');

  const url = 'https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201810&crn_in=17822';

  expect(ellucianSectionParser.supportsPage(url)).toBe(true);

  const retVal = ellucianSectionParser.parse(body, url);

  expect(retVal).toMatchSnapshot();

  done();
});
