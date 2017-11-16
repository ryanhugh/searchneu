/*
 * This file is part of Search NEU and licensed under AGPL3. 
 * See the license file in the root folder for details. 
 */

import employees from '../employees';

it('findName should work', () => {
  const output = employees.findName(['a', 'b', 'sr', 'bob']);
  expect(output).toBe('bob');
});
