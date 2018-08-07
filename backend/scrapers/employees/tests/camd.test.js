/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import fs from 'fs-extra';
import path from 'path';

import camd from '../camd';


it('should work for profile page', async (done) => {
  const body = await fs.readFile(path.join(__dirname, 'data', 'camd', 'profile.html'));

  const url = 'https://camd.northeastern.edu/gamedesign/people/jason-duhaime/';

  const output = camd.parseDetailpage(url, body);

  expect(output).toMatchSnapshot();

  done();
});
