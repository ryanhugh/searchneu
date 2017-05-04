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

var fs = require('fs')
var prereqClassUids = require('../prereqClassUids')
const termDump = require('./data/termDump');


it('can substitute one line', function () {

	var keyToRows = {
		'neu.edu201770MATH2500': [{
			subject: 'MATH',
			classUid: '2500_34343'
		}]
	}

	var prereqs = {
		type: 'or',
		values: [
			'dd', {
				classId: '2500',
				subject: 'MATH'
			}
		]
	}

	var output = prereqClassUids.updatePrereqs(prereqs, 'neu.edu', '201770', keyToRows)

	expect(output).toEqual({
		type: 'or',
		values: ['dd', {
			subject: 'MATH',
			classUid: '2500_34343'
		}]
	})
});

it('can insert a missing if cant find in db', function () {

	var keyToRows = {}

	var prereqs = {
		type: 'or',
		values: [{
			classId: '2500',
			subject: 'MATH'
		}]
	}

	var output = prereqClassUids.updatePrereqs(prereqs, 'neu.edu', '201770', keyToRows)

	expect(output).toEqual({
		type: 'or',
		values: [{
			subject: 'MATH',
			classId: '2500',
			missing: true
		}]
	})
});



it('can replace a class with multiple matches with an "or"', function () {

	var prereqs = {
		type: 'or',
		values: [
			'dd', {
				classId: '2500',
				subject: 'MATH'
			}
		]
	}

	var keyToRows = {
		'neu.edu201770MATH2500': [{
			subject: 'MATH',
			classUid: '2500_77777'
		}, {
			subject: 'MATH',
			classUid: '2500_1222121'
		}]
	}

	var output = prereqClassUids.updatePrereqs(prereqs, 'neu.edu', '201770', keyToRows)


	expect(output).toEqual({
		"type": "or",
		"values": ["dd", {
			"type": "or",
			"values": [{
				"subject": "MATH",
				"classUid": "2500_77777"
			}, {
				"subject": "MATH",
				"classUid": "2500_1222121"
			}]
		}]
	})
});


it('go should work', function () {


	// var baseQuery = {
	// 	"classId": "061",
	// 	"host": "swarthmore.edu",
	// 	"termId": "201602",
	// 	"subject": "STAT"
	// }

	var aClass = {
    "_id": "5726589fd4a30537f9139321",
    "desc": "",
    "classId": "061",
    "prettyUrl": "https://myswat.swarthmore.edu/pls/bwckctlg.p_disp_course_detail?cat_term_in=201602&subj_code_in=STAT&crse_numb_in=061",
    "name": "Mathematical Statistics I",
    "url": "https://myswat.swarthmore.edu/pls/bwckctlg.p_disp_listcrse?schd_in=%25&term_in=201602&subj_in=STAT&crse_in=061",
    "prereqs": {
        "type": "or",
        "values": [{
            "classId": "023",
            "subject": "MATH"
        }, {
            "classId": "033",
            "subject": "MATH"
        }, {
            "classId": "034",
            "subject": "MATH"
        }]
    },
    "host": "swarthmore.edu",
    "termId": "201602",
    "subject": "STAT",
    "crns": [
        "25846",
        "25862"
    ],
    "lastUpdateTime": 1462130844694,
    "deps": {
        "EllucianSectionParser": [
            "5726589dd4a30537f9139302",
            "5726589ed4a30537f913931e"
        ]
    },
    "minCredits": 1,
    "maxCredits": 1,
    "updatedByParent": false,
    "classUid": "061_1925216900"
}
var termDump = {
	classes: [aClass]
}


	var updatedClasses = prereqClassUids.go(termDump)
	expect(updatedClasses.length).toBe(1)
	expect(updatedClasses[0].prereqs.values[0].classUid).toBe('023_1049977931')
	expect(updatedClasses[0].prereqs.values[0].classId).toBe(undefined)
	expect(updatedClasses[0].prereqs.values.length).toBe(3)
});


it('can swap coreqs', function (done) {

	var baseQuery = {
		"classUid": "017_1314190396",
		"host": "swarthmore.edu",
		"termId": "201602",
		"subject": "EDUC"
	}

	prereqClassUids.go([baseQuery], function (err, updatedClasses) {
		expect(updatedClasses.length).toBe(1)
		console.log(updatedClasses[0].coreqs);
		expect(updatedClasses[0].coreqs.values[0].classUid).toBe('016_1711862930')
		done()
	}.bind(this))


});




it('can simplify', function (done) {


	var baseQuery = {
		"classId": "031",
		"host": "swarthmore.edu",
		"termId": "201602",
		"subject": "STAT"
	}

	prereqClassUids.go([baseQuery], function (err, updatedClasses) {
		expect(updatedClasses.length).toBe(1)

		updatedClasses[0].prereqs.values.forEach(function (prereq) {
			expect(prereq.subject).not.toBe(undefined);

			expect(prereq.values).toBe(undefined)
			expect(prereq.type).toBe(undefined)

		}.bind(this))

		done()
	}.bind(this))
});
