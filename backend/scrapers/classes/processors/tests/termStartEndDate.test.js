/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import testData from './testData';
import termStartEndDate from '../termStartEndDate';


it('works', async (done) => {
  const termDump = await testData.loadTermDump();

  termStartEndDate.go(termDump);
  expect(termDump.terms.length).toBe(1);
  expect(termDump.terms[0].startDate).toBe('16819');
  expect(termDump.terms[0].endDate).toBe('16935');
  done();
});
