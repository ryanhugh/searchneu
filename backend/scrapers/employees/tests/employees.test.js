/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import fs from 'fs-extra';
import path from 'path';
import atob from 'atob';

import employees from '../employees';


it('findName should work', () => {
  const output = employees.findName(['a', 'b', 'sr', 'bob']);
  expect(output).toBe('bob');
});


// Test to make sure parsing of an employees result page stays the same
it('should be able to parse a page of be', async (done) => {
  const body = await fs.readFile(path.join(__dirname, 'data', 'employees', 'employee results last name startswith be.html'), 'utf8');

  employees.parseLettersResponse({ body:body }, 'be');

  // As documented in the employees.js file, the decoded string should be 16 bytes.
  // Idk what those bytes mean, but we can check the length
  for (const employee of employees.people) {
    expect(atob(decodeURIComponent(employee.id)).length).toBe(16);
  }

  expect(employees.people).toMatchSnapshot();

  done();
});
