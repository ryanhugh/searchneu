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

 var ellucianClassParser = require('../ellucianClassParser')
var ellucianSectionParser = require('../ellucianSectionParser')
var fs = require('fs')
var pointer = require('../../pointer')
var PageData = require('../../PageData')
var URI = require('urijs')



it('can find an existing dep and parse crns', function (done) {
	fs.readFile('backend/parsers/tests/data/ellucianClassParser/1.html', 'utf8', function (err, body) {
		expect(err).toBe(null);

		pointer.handleRequestResponce(body, function (err, dom) {
			expect(err).toBe(null);

			//set up variables
			var url = 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=201610&subj_in=EECE&crse_in=2160&schd_in=LEC';
			var pageData = PageData.create({
				dbData: {
					url: url,
					desc: '',
					classId: '2160',
					name: 'Embedded Design Enabling Robotics'
				}
			});

			pageData.deps = [PageData.create({
				dbData: {
					url: 'https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201610&crn_in=15633',
					crn: "15633"
				}
			})]
			pageData.deps[0].parser = ellucianSectionParser;
			pageData.deps[0].parent = pageData;

			//main parse
			ellucianClassParser.parseDOM(pageData, dom);


			expect(ellucianClassParser.supportsPage(url)).toBe(true);


			expect(pageData.dbData).toEqual({
				url: url,
				classId: '2160',
				desc: '',
				name: 'Embedded Design Enabling Robotics',
				crns: ['15633', '15636', '15639', '16102', '17800', '17799']
			}, JSON.stringify(pageData.dbData));


			expect(pageData.deps.length).toBe(6);
			pageData.deps.forEach(function (dep) {
				expect(dep.parent).toBe(pageData);
				expect(dep.parser).toBe(ellucianSectionParser)
			});
			done()

		});
	});

});

it('should parse a bunch of deps', function (done) {

	//sections have different names
	fs.readFile('backend/parsers/tests/data/ellucianClassParser/multiname.html', 'utf8', function (err, body) {
		expect(err).toBe(null);
		pointer.handleRequestResponce(body, function (err, dom) {
			expect(err).toBe(null);


			//set up variables -- ellucianClassParser url might not be correct
			var url = 'https://myswat.swarthmore.edu/pls/bwckctlg.p_disp_listcrse?term_in=201502&subj_in=PHYS&crse_in=013&schd_in=LE';
			var pageData = PageData.create({
				dbData: {
					url: url,
					desc: '',
					classId: '013',
				}
			});


			//main parse
			ellucianClassParser.parseDOM(pageData, dom);


			expect(ellucianClassParser.supportsPage(url)).toBe(true);

			expect(pageData.dbData).toEqual({
				url: url,
				desc: '',
				classId: '013',
				name: 'Thermodynamic/ Mech',
				crns: ['24600']
			}, JSON.stringify(pageData.dbData));

			//first dep is the section, second dep is the class - Lab (which has 3 deps, each section)
			// console.log(pageData.deps)
			expect(pageData.deps.length).toBe(2);
			expect(pageData.deps[0].parent).toBe(pageData);
			expect(pageData.deps[0].parser).toBe(ellucianSectionParser);

			//pageData.deps[1] is the other class
			expect(pageData.deps[1].parser).toBe(ellucianClassParser);

			expect(pageData.deps[1].dbData.classId).toBe('013') 
			expect(pageData.deps[1].dbData.crns).toEqual(['24601', '24603', '25363']);
			expect(pageData.deps[1].dbData.name).toBe('Thermodyn/Stat Mechanics - Lab');
			expect(pageData.deps[1].deps.length).toBe(3);
			expect(pageData.deps[1].deps[0].parser).toBe(ellucianSectionParser);
			expect(pageData.deps[1].deps[1].parser).toBe(ellucianSectionParser);
			expect(pageData.deps[1].deps[2].parser).toBe(ellucianSectionParser);


			expect(new URI(pageData.deps[1].deps[0].dbData.url).equals(new URI("https://myswat.swarthmore.edu/pls/bwckschd.p_disp_detail_sched?term_in=201502&crn_in=24601"))).toBe(true);
			expect(pageData.deps[1].deps[0].dbData.crn).toBe("24601");
			expect(pageData.deps[1].deps[0].dbData.meetings.length).toBe(1);

			expect(pageData.deps[1].deps[0].dbData.meetings[0]).toEqual({
				"startDate": 16454,
				"endDate": 16500,
				"profs": [
					"Peter J Collings",
					"MaryAnn Hickman Klassen"
				],
				"where": "Science Center L44",
				"times": {
					"1": [{
						"start": 47700,
						"end": 58500
					}]
				},
				"type": "Class"
			});
			done()
		});
	});
});

it('should parse a bunch of crns', function (done) {

	fs.readFile('backend/parsers/tests/data/ellucianClassParser/3.html', 'utf8', function (err, body) {
		expect(err).toBe(null);
		pointer.handleRequestResponce(body, function (err, dom) {
			expect(err).toBe(null);

			//set up variables
			var url = 'https://prd-wlssb.temple.edu/prod8/bwckctlg.p_disp_listcrse?term_in=201503&subj_in=ACCT&crse_in=2102&schd_in=BAS';
			var pageData = PageData.create({
				dbData: {
					url: url,
					desc: '',
					classId: '2102'
				}
			});

			//main parse
			ellucianClassParser.parseDOM(pageData, dom);


			expect(ellucianClassParser.supportsPage(url)).toBe(true);

			expect(pageData.dbData).toEqual({
				url: url,
				classId: '2102',
				desc: '',
				name: 'Managerial Accounting',
				crns: ["11018", "11019", "8145", "6073", "11020", "6129", "20800", "6074", "23294", "23295", "6075", "6077", "6130", "11679", "22497", "19962", "24435"]
			});

			expect(pageData.deps.length).toBe(17);
			pageData.deps.forEach(function (dep) {
				expect(dep.parent).toBe(pageData);
				expect(dep.parser).toBe(ellucianSectionParser)
			});
			done()
		});
	});
});


it('should parse a bunch of meetings', function (done) {


	//lots of different meetings
	fs.readFile('backend/parsers/tests/data/ellucianClassParser/4.html', 'utf8', function (err, body) {
		expect(err).toBe(null);

		pointer.handleRequestResponce(body, function (err, dom) {
			expect(err).toBe(null);

			//set up variables
			var url = 'https://prd-wlssb.temple.edu/prod8/bwckctlg.p_disp_listcrse?term_in=201503&subj_in=AIRF&crse_in=2041&schd_in=BAS';
			var pageData = PageData.create({
				dbData: {
					url: url,
					desc: '',
					classId: '2041'
				}
			});

			//main parse
			ellucianClassParser.parseDOM(pageData, dom);


			expect(ellucianClassParser.supportsPage(url)).toBe(true);

			expect(pageData.dbData).toEqual({
				url: url,
				desc: '',
				classId: '2041',
				name: 'The Evolution of U.S. Aerospace Power II',
				crns: ['12090']
			});

			expect(pageData.deps.length).toBe(1);

			var dep = pageData.deps[0];

			expect(dep.parent).toBe(pageData);
			expect(dep.parser).toBe(ellucianSectionParser)

			expect(new URI(dep.dbData.url).equals(new URI("https://prd-wlssb.temple.edu/prod8/bwckschd.p_disp_detail_sched?term_in=201503&crn_in=12090"))).toBe(true);
			expect(dep.dbData.crn).toBe("12090");
			expect(dep.dbData.classId).toBe("2041");
			expect(dep.dbData.meetings).toEqual([{
				"startDate": 16457,
				"endDate": 16457,
				"profs": ["Nicholas A Vallera"],
				"where": "TBA",
				"type": "Class",
				"times": {
					"4": [{
						"start": 21600,
						"end": 27600
					}]
				}
			}, {
				"startDate": 16471,
				"endDate": 16471,
				"profs": ["Nicholas A Vallera"],
				"where": "TBA",
				"type": "Class",
				"times": {
					"4": [{
						"start": 21600,
						"end": 27600
					}]
				}
			}, {
				"startDate": 16485,
				"endDate": 16485,
				"profs": ["Nicholas A Vallera"],
				"where": "TBA",
				"type": "Class",
				"times": {
					"4": [{
						"start": 21600,
						"end": 27600
					}]
				}
			}, {
				"startDate": 16499,
				"endDate": 16499,
				"profs": ["Nicholas A Vallera"],
				"where": "TBA",
				"type": "Class",
				"times": {
					"4": [{
						"start": 21600,
						"end": 27600
					}]
				}
			}, {
				"startDate": 16513,
				"endDate": 16513,
				"profs": ["Nicholas A Vallera"],
				"where": "TBA",
				"type": "Class",
				"times": {
					"4": [{
						"start": 21600,
						"end": 27600
					}]
				}
			}, {
				"startDate": 16527,
				"endDate": 16527,
				"profs": ["Nicholas A Vallera"],
				"where": "TBA",
				"type": "Class",
				"times": {
					"4": [{
						"start": 21600,
						"end": 27600
					}]
				}
			}, {
				"startDate": 16541,
				"endDate": 16541,
				"profs": ["Nicholas A Vallera"],
				"where": "TBA",
				"type": "Class",
				"times": {
					"4": [{
						"start": 21600,
						"end": 27600
					}]
				}
			}, {
				"startDate": 16555,
				"endDate": 16555,
				"profs": ["Nicholas A Vallera"],
				"where": "TBA",
				"type": "Class",
				"times": {
					"4": [{
						"start": 21600,
						"end": 27600
					}]
				}
			}]);
			done()
		});
	});
});

it('can parse CANCELLED', function (done) {


	//cancelled - something was weird with ellucianClassParser one not sure what it was
	fs.readFile('backend/parsers/tests/data/ellucianClassParser/6.html', 'utf8', function (err, body) {
		expect(err).toBe(null);
		pointer.handleRequestResponce(body, function (err, dom) {
			expect(err).toBe(null);

			//set up variables
			var url = 'https://ssb.ccsu.edu/pls/ssb_cPROD/bwckctlg.p_disp_listcrse?term_in=201610&subj_in=ANTH&crse_in=245&schd_in=LE';
			var pageData = PageData.create({
				dbData: {
					url: url,
					desc: '',
					classId: '245'
				}
			});

			//main parse
			ellucianClassParser.parseDOM(pageData, dom);


			expect(ellucianClassParser.supportsPage(url)).toBe(true);

			expect(pageData.dbData.url).toBe(url);
			expect(pageData.dbData.classId).toBe('245')
			expect(pageData.dbData.desc).toBe('')
			expect(pageData.dbData.name).toBe('CANCELLED')
			expect(pageData.dbData.crns.length).toBe(1)
			expect(pageData.dbData.crns[0]).toBe('12291')


			expect(pageData.deps.length).toBe(1);
			pageData.deps.forEach(function (dep) {
				expect(dep.parent).toBe(pageData);
				expect(dep.parser).toBe(ellucianSectionParser);
			});
			done()
		});
	});

});


//make sure ellucianClassParser.classNameTranslation works
it('name translatin works', function (done) {

	fs.readFile('backend/parsers/tests/data/ellucianClassParser/rename.html', 'utf8', function (err, body) {
		expect(err).toBe(null);
		pointer.handleRequestResponce(body, function (err, dom) {
			expect(err).toBe(null);

			//set up variables
			var url = 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=201610&subj_in=CS&crse_in=2500&schd_in=LEC';
			var pageData = PageData.create({
				dbData: {
					url: url,
					desc: '',
					classId: '2500'
				}
			});

			//main parse
			ellucianClassParser.parseDOM(pageData, dom);

			expect(ellucianClassParser.supportsPage(url)).toBe(true);

			// five sections of fundies, and 1 alt class (hon, which has 1 section)
			expect(pageData.deps.length).toBe(6);
			done()
		});
	});
});

// classes that are deps of other classes and on this update have no crns
it('removes dead classes', function () {

	var url = 'some url'
	var pageData = PageData.create({
		dbData: {
			url: url,
			desc: '',
			classId: '2160',
			name: 'Embedded Design Enabling Robotics',
		}
	});
	pageData.parsingData.crns = []

	pageData.deps = [PageData.create({
		dbData: {
			url: url,
		}
	})]
	pageData.deps[0].parser = ellucianClassParser;
	pageData.deps[0].parent = pageData;

	ellucianClassParser.onEndParsing(pageData);

	expect(pageData.deps.length).toBe(0)
});

