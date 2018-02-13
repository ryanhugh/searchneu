/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import fs from 'fs-extra';
import path from 'path';

import cssh from '../cssh';

it('should be able to parse a detail apge', async () => {
  const body = await fs.readFile(path.join(__dirname, 'data', 'cssh', 'detailpage.html'), 'utf8');

  const output = cssh.parseDetailpage('https://www.northeastern.edu/cssh/faculty/max-abrahms', { body:body });

  expect(output).toMatchSnapshot();
});
