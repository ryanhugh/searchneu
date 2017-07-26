/*
 * Copyright (c) 2017 Ryan Hughes
 *
 * This file is part of CoursePro.
 *
 * CoursePro is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License
 * version 3 as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
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
