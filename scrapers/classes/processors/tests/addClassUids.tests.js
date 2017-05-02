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

 var addClassUids = require('../addClassUids')


it('should work', function () {
	expect(addClassUids.getClassUid('001A', 'Int:Gender & Sexuality-attach')).toBe('001A_446579316');
});


it('addClassUids should work 2', function (done) {
	addClassUids.go([{
		host: 'swarthmore.edu',
		termId: '201602',
		subject: 'GSST',
		classId: '001A'
	}], function (err, results) {
		expect(err).toBe(null);
		expect(results[0].classUid).toBe('001A_446579316');
		done()
	}.bind(this))
});
 