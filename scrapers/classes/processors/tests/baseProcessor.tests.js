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

'use strict';

var baseProcessor = require('../baseProcessor')


it('should work', function () {
	var result = baseProcessor.getCommonHostAndTerm([{
		host: 'neu.edu',
		termId: '201710'
	}, {
		host: 'neu.edu',
		termId: '123456'
	}])


	expect(result).toEqual({
		host: 'neu.edu'
	})
});

it('isUpdatingEntireTerm should work', function () {
	expect(baseProcessor.isUpdatingEntireTerm([{
		host: 'neu.edu'
	}])).toBe(true)


	expect(baseProcessor.isUpdatingEntireTerm([{
		host: 'neu.edu',
		termId: '33443'
	}])).toBe(true)

	expect(baseProcessor.isUpdatingEntireTerm([{
		host: 'neu.edu',
		subject: 'neu.edu'
	}])).toBe(false)

});

