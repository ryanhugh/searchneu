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

import request from '../../../request';
var fs = require('fs-promise')
var path = require('path')
var baseParser = require('../baseParser')


it('toTitleCase works', function () {

	expect(baseParser.toTitleCase('TBA')).toBe('TBA');
	expect(baseParser.toTitleCase('Texas A&M University')).toBe('Texas A&M University');
});

it('standardizeClassName', function () {

	expect(baseParser.standardizeClassName('2nd Year Japanese')).toBe('2nd Year Japanese');
	expect(baseParser.standardizeClassName('BMC: General Chemistry II')).toBe('BMC: General Chemistry II');

	var goodName = 'Interactive Learning Seminar for Physics 1151'
	expect(baseParser.standardizeClassName('Int. Learn for Phys 1151', [goodName])).toBe(goodName);

	var goodName = 'Connections and Decisions'
	expect(baseParser.standardizeClassName('Connections & Decisions', ['hihfdsjal', goodName])).toBe(goodName);

	var classNameTranslation = {

		// math
		'Calculus 3 for Sci/engr (hon)': 'Calculus 3 for Science and Engineering (hon)',
		'Calculus 3 for Sci/engr(hon)': 'Calculus 3 for Science and Engineering (hon)',
		'Calculus 2 for Sci/engr (hon)': 'Calculus 2 for Science and Engineering (hon)',
		'Calculus 1 for Sci/engr (hon)': 'Calculus 1 for Science and Engineering (hon)',
		'Calculus 1for Sci/engr (hon)': 'Calculus 1 for Science and Engineering (hon)',
		"Calc for Business/econ (hon)": 'Calculus for Business and Economics (hon)',
		'Calc & Diff Eq - Biol 1(hon)': 'Calculus and Differential Equations for Biology 1 (hon)',

		// econ
		'Principles of Microecon (hon)': 'Principles of Microeconomics (hon)',

		// cs
		'Fundamental of Com Sci1': 'Fundamentals of Computer Science 1',
		'Fundamentals of Com Sci1 (hon)': 'Fundamentals of Computer Science 1 (hon)',
		'Crisis Resolution in Mdl East': 'Crisis Resolution in Middle East'
	}

	for (var badName in classNameTranslation) {
		var goodName = classNameTranslation[badName]
		expect(baseParser.standardizeClassName(badName, ['hihfdsjal', goodName])).toBe(goodName);
	}


	// additional tests just for the new name standardizer
	classNameTranslation = {
		'Foundations of Psych': 'Foundations of Psychology',
		'Arch,infrastructure&city ': 'Architecture, Infrastructure, and the City',
		'Principles of Macroecon    (hon)   ': 'Principles of Macroeconomics (hon)',
	}


	for (var badName in classNameTranslation) {
		var goodName = classNameTranslation[badName]
		expect(baseParser.standardizeClassName(badName, ['hihfdsjal', goodName])).toBe(goodName);
	}


	var badName = 'Dif Eq & Lin Alg Fr Engr'
	var possibleMatch = 'Differential Equations and Linear Algebra for Engineering (hon)'
	var goodName = 'Differential Equations and Linear Algebra for Engineering'
	expect(baseParser.standardizeClassName(badName, ['hihfdsjal', possibleMatch])).toBe(goodName);


	var badName = 'General Phys I- Lab'
	var possibleMatch = 'General Physics I'
	var goodName = 'General Physics I - Lab'
	expect(baseParser.standardizeClassName(badName, ['hihfdsjal', possibleMatch])).toBe(goodName);


	var badName = 'Co-op Work Experience--cj'
	var possibleMatch = 'Co-op Work Experience-as'
	var goodName = 'Co-op Work Experience - cj'
	expect(baseParser.standardizeClassName(badName, ['hihfdsjal', possibleMatch])).toBe(goodName);

	expect(baseParser.standardizeClassName('hi    (yo)')).toBe('hi (yo)');

	expect(baseParser.standardizeClassName('hi (HON)')).toBe('hi (hon)');


	var name = 'St: Wireless Sensor Networks'
	expect(baseParser.standardizeClassName(name, ['St: Intro. to Multiferroics'])).toBe(name);

	expect(baseParser.standardizeClassName('Directed Reading', ['Dir Rdg:'])).toBe('Directed Reading');

	// Should pick the first one when name length === 0
	expect(baseParser.standardizeClassName('', ['hihfdsjal', 'soemthing else'])).toBe('hihfdsjal');
});


it('parseTable', async function (done) {


	const body = await fs.readFile(path.join(__dirname, 'data', 'baseParser', '1.html'), 'utf8');

	request.handleRequestResponce(body, function (err, dom) {
		expect(err).toBe(null);

		// I switched it to .rowCount and .tableData so this dosen't work yet
		expect(baseParser.parseTable(dom[0])).toEqual({
			_rowCount: 1,
			type: ['Class'],
			time: ['11:00 am - 11:50 am'],
			days: ['MWF'],
			where: ['Anderson Hall 00806'],
			partofterm: ['1'],
			daterange: ['Jan 12, 2015 - May 06, 2015'],
			scheduletype: ['Base Lecture'],
			instructors: ['Rujuta P.  Chincholkar-Mandelia (P)']
		});

		done()
	});
});


it('parseTable should work 2', async function (done) {


	const body = await fs.readFile(path.join(__dirname, 'data', 'baseParser', '3.html'), 'utf8');

	var fileJSON = JSON.parse(body);

	request.handleRequestResponce(fileJSON.body, function (err, dom) {
		expect(err).toBe(null);

		// I switched it to .rowCount and .tableData so this dosen't work yet
		expect(baseParser.parseTable(dom[0])).toEqual({
			_rowCount: 2,
			headercontent1: ['Footer content 1', 'Body content 1'],
			headercontent2: ['Footer content 2', 'Body content 2']
		});
		
		done()
	});

});



var text = "\n" +
"    1.000 TO     2.000 Credit hours\n" +
"\n" +
"\n" +
"Levels: Undergraduate Transcript\n" +
"\n" +
"Schedule Types: Research Project\n" +
"\n" +
"\n" +
"Non-Divisional Division\n" +
"\n" +
"Cognitive Science Department\n" +
"\n" +
"\n" +
"\n" +
"\n" 

it('credit test', function() {
	var a = baseParser.parseCredits(text)
	expect(a.minCredits).toBe(1)
	expect(a.maxCredits).toBe(2)

	var a = baseParser.parseCredits('3 to 5 credits')
	expect(a.minCredits).toBe(3)
	expect(a.maxCredits).toBe(5)

	// min cant be greater than max
	var a = baseParser.parseCredits('8 to 5 credit hours')
	expect(a.minCredits).toBe(5)
	expect(a.maxCredits).toBe(5)


	// min cant be greater than max
	var a = baseParser.parseCredits('Credit Hours: 8.000')
	expect(a.minCredits).toBe(8)
	expect(a.maxCredits).toBe(8)


});

it('simplifySymbols', function() {
	var a = baseParser.simplifySymbols('‚‚‚„„„')
	expect(a).toBe('\'\'\'"""')
});		

it('credit parser can parse Continuing Education Units ', function() {
	var credits = baseParser.parseCredits('// 0.800 Continuing Education Units ')
	expect(credits.minCredits).toBe(.8)
	expect(credits.maxCredits).toBe(.8)
});