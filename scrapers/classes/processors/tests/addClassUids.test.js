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

 const addClassUids = require('../addClassUids');
 const termDump = require('./data/termDump');


 it('should work', () => {
   expect(addClassUids.getClassUid('001A', 'Int:Gender & Sexuality-attach')).toBe('001A_446579316');
 });


 it('addClassUids should work 2', () => {
   const output = addClassUids.go(termDump);
   expect(output.classes[0].classUid).toBe('001A_446579316');
 });
