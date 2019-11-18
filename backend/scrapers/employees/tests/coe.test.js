/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import fs from 'fs-extra';
import path from 'path';

import coe from '../coe';

it('should parse all', async (done) => {
  const data = await fs.readFile(path.join(__dirname, 'data', 'coe', 'display-all.json'));

  const resp = JSON.parse(data);
  const retVal = coe.parsePeopleList(resp);

  expect(retVal).toMatchSnapshot();
  done();
});
