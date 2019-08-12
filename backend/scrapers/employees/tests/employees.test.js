/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import fs from 'fs-extra';
import path from 'path';

import employees from '../employees';



//"employee results last name startswith be.html"

it('findName should work', () => {
  const output = employees.findName(['a', 'b', 'sr', 'bob']);
  expect(output).toBe('bob');
});






it('should be able to parse a page', async (done) => {
  const body = await fs.readFile(path.join(__dirname, 'data', 'employees', 'employee results last name startswith be.html'), 'utf8');

  const output = await employees.parseLettersResponse(body, 'be');

  console.log(output);

  done();

  // expect(output).toMatchSnapshot();
});
