/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import fs from 'fs-extra';
import path from 'path';

import clubs from '../clubs';

it('parseDetails should work', async (done) => {
  const data = await fs.readFile(path.join(__dirname, 'data', 'clubs', 'club.json'));
  const resp = JSON.parse(data);
  const output = clubs.parseDetails(resp.body);

  expect(output).toMatchSnapshot();
  done();
});

it('parseLetterAndPage should work', async (done) => {
  const data = await fs.readFile(path.join(__dirname, 'data', 'clubs', 'letter.json'));
  const resp = JSON.parse(data);
  const output = clubs.parseLetterAndPage(resp);

  expect(output).toMatchSnapshot();
  done();
});
