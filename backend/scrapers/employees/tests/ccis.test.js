/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import fs from 'fs-extra';
import path from 'path';

import ccis from '../ccis';


it('should parse all people', async (done) => {
  const data = await fs.readFile(path.join(__dirname, 'data', 'ccis', 'view_all_people.json'));

  const resp = JSON.parse(data);
  const output = ccis.parsePeopleList(resp);

  expect(output).toMatchSnapshot();
  done();
});


it('parseDetailpage', async (done) => {
  const data = await fs.readFile(path.join(__dirname, 'data', 'ccis', 'person.json'));
  const resp = JSON.parse(data);

  const output = ccis.parseDetailpage(resp);

  expect(output).toMatchSnapshot();
  done();
});
