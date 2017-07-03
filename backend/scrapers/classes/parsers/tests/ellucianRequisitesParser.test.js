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

import path from 'path';
import request from '../../../request';
import macros from '../../../../macros';

var ellucianRequisitesParser = require('../ellucianRequisitesParser2')
var fs = require('fs')
var PageData = require('../../PageData')


it('should load a bunch of string prereqs from many on linked.html', function (done) {
	fs.readFile(path.join(__dirname, 'data', 'ellucianSectionParser', 'many non linked.html'), 'utf8', function (err, body) {
		expect(err).toBe(null);

		request.handleRequestResponce(body, function (err, dom) {
			expect(err).toBe(null);

			var url = 'http://test.hostname.com/PROD/';

			var pageData = PageData.create({
				dbData: {
					url: url
				}
			});

			var prereqs = ellucianRequisitesParser.parseRequirementSection(pageData, dom, 'prerequisites');

			expect(prereqs).toEqual({
				"type": "or",
				"values": [{
					"type": "and",
					"values": [{
						"classId": "050",
						"subject": "ENG"
					}, {
						"classId": "040",
						"subject": "MAT"
					}]
				}, {
					"type": "and",
					"values": [{
							"classId": "050",
							"subject": "ENG"
						},
						"Arith - Place Test 06"
					]
				}, {
					"type": "and",
					"values": [{
							"classId": "050",
							"subject": "ENG"
						},
						"Arith - Quick Screen Place 06"
					]
				}, {
					"type": "and",
					"values": [{
							"classId": "050",
							"subject": "ENG"
						},
						"Accuplacer (AR) 067"
					]
				}, {
					"type": "and",
					"values": [{
							"classId": "050",
							"subject": "ENG"
						},
						"Accuplacer (EA) 040"
					]
				}, {
					"type": "and",
					"values": [
						"Eng - Place Test 03",
						"Arith - Place Test 06"
					]
				}, {
					"type": "and",
					"values": [
						"Eng - Place Test 03",
						"Arith - Quick Screen Place 06"
					]
				}, {
					"type": "and",
					"values": [
						"Eng - Place Test 03",
						"Accuplacer (AR) 067"
					]
				}, {
					"type": "and",
					"values": [
						"Eng - Place Test 03",
						"Accuplacer (EA) 040"
					]
				}, {
					"type": "and",
					"values": [
						"Eng - Place Test 03", {
							"classId": "040",
							"subject": "MAT"
						}
					]
				}, {
					"type": "and",
					"values": [
						"Eng - Quick Screen Place 03",
						"Arith - Place Test 06"
					]
				}, {
					"type": "and",
					"values": [
						"Eng - Quick Screen Place 03",
						"Arith - Quick Screen Place 06"
					]
				}, {
					"type": "and",
					"values": [
						"Eng - Quick Screen Place 03",
						"Accuplacer (AR) 067"
					]
				}, {
					"type": "and",
					"values": [
						"Eng - Quick Screen Place 03",
						"Accuplacer (EA) 040"
					]
				}, {
					"type": "and",
					"values": [
						"Eng - Quick Screen Place 03", {
							"classId": "040",
							"subject": "MAT"
						}
					]
				}, {
					"classId": "100",
					"subject": "ENG"
				}]
			});
			done()
		});
	});

});


it('should filter out prereqs that just say they are prereqs', function (done) {
	fs.readFile(path.join(__dirname, 'data', 'ellucianSectionParser', 'blacklistedstring.html'), 'utf8', function (err, body) {
		expect(err).toBe(null);

		request.handleRequestResponce(body, function (err, dom) {
			expect(err).toBe(null);

			var url = 'http://test.hostname.com/PROD/';

			var pageData = PageData.create({
				dbData: {
					url: url
				}
			});

			var prereqs = ellucianRequisitesParser.parseRequirementSection(pageData, dom, 'prerequisites');

			expect(prereqs).toEqual({
				type: 'and',
				values: [{
					type: 'or',
					values: [{
						classId: '027',
						subject: 'MATH'
					}, {
						classId: '016',
						subject: 'MATH'
					}, {
						classId: '028',
						subject: 'MATH'
					}, {
						classId: '016H',
						subject: 'MATH'
					}, {
						classId: '028S',
						subject: 'MATH'
					}, {
						classId: '028P',
						subject: 'MATH'
					}, {
						classId: '016HS',
						subject: 'MATH'
					}]
				}, {
					type: 'or',
					values: [{
						classId: '033',
						subject: 'MATH'
					}, {
						classId: '034',
						subject: 'MATH'
					}, {
						classId: '035',
						subject: 'MATH'
					}, {
						classId: '018',
						subject: 'MATH'
					}, {
						classId: '018H',
						subject: 'MATH'
					}]
				}]
			})
			done()
		});
	})
});




// it('formatRequirements should work', function () {


// 	expect(ellucianRequisitesParser.formatRequirements([
// 		["https://www2.augustatech.edu/pls/ban8/bwckctlg.p_disp_listcrse?term_in=201614&subj_in=WELD&crse_in=1152&schd_in=%25", "or", "https://www2.augustatech.edu/pls/ban8/bwckctlg.p_disp_listcrse?term_in=201614&subj_in=WLD&crse_in=152&schd_in=%25"], "or", ["https://www2.augustatech.edu/pls/ban8/bwckctlg.p_disp_listcrse?term_in=201614&subj_in=WELD&crse_in=1152&schd_in=%25", "or", "https://www2.augustatech.edu/pls/ban8/bwckctlg.p_disp_listcrse?term_in=201614&subj_in=WLD&crse_in=152&schd_in=%25"]
// 	])).toEqual({
// 		"type": "or",
// 		"values": [{
// 			"type": "or",
// 			"values": ["https://www2.augustatech.edu/pls/ban8/bwckctlg.p_disp_listcrse?term_in=201614&subj_in=WELD&crse_in=1152&schd_in=%25", "https://www2.augustatech.edu/pls/ban8/bwckctlg.p_disp_listcrse?term_in=201614&subj_in=WLD&crse_in=152&schd_in=%25"]
// 		}, {
// 			"type": "or",
// 			"values": ["https://www2.augustatech.edu/pls/ban8/bwckctlg.p_disp_listcrse?term_in=201614&subj_in=WELD&crse_in=1152&schd_in=%25", "https://www2.augustatech.edu/pls/ban8/bwckctlg.p_disp_listcrse?term_in=201614&subj_in=WLD&crse_in=152&schd_in=%25"]
// 		}]
// 	});


// });

it('simplifyRequirements shoudl work', function () {

	expect(ellucianRequisitesParser.simplifyRequirements({
		type: 'or',
		values: [{
			type: 'or',
			values: ['1', {
				type: 'or',
				values: ['6']
			}]
		}, {
			type: 'or',
			values: ['1', {
				type: 'or',
				values: [{
					type: 'or',
					values: ['1', {
						type: 'or',
						values: ['6']
					}]
				}, {
					type: 'or',
					values: ['1', {
						type: 'or',
						values: ['6']
					}]
				}]
			}]
		}]
	})).toEqual({
		type: 'or',
		values: ['1', '6', '1', '1', '6', '1', '6']
	});

});


it('simplifyRequirements shoudl work', function () {

	expect(ellucianRequisitesParser.simplifyRequirements({
		"type": "and",
		"values": [{
			"type": "or",
			"values": [{
				"subject": "PHYS",
				"classUid": "1148_1041629977"
			}, {
				"subject": "PHYS",
				"classUid": "1148_1041629977"
			}]
		}]
	})).toEqual({
		"type": "or",
		"values": [{
			"subject": "PHYS",
			"classUid": "1148_1041629977"
		}, {
			"subject": "PHYS",
			"classUid": "1148_1041629977"
		}]
	});

});



// it('groupRequirementsByAnd', function () {


// 	expect(ellucianRequisitesParser.groupRequirementsByAnd(
// 		['https://google.com/pls/ban8/bwckctlg.p_disp_listcrse?term_in=201516&subj_in=MCHT&crse_in=1011&schd_in=%25',
// 			'or',
// 			'https://google.com/pls/ban8/bwckctlg.p_disp_listcrse?term_in=201516&subj_in=MCH&crse_in=101&schd_in=%25',
// 			'and',
// 			'https://google.com/pls/ban8/bwckctlg.p_disp_listcrse?term_in=201516&subj_in=MCHT&crse_in=1012&schd_in=%25',
// 			'or',
// 			'https://google.com/pls/ban8/bwckctlg.p_disp_listcrse?term_in=201516&subj_in=MCHT&crse_in=1012&schd_in=%25', 'or', 'link here'
// 		])).toEqual(

// 		['https://google.com/pls/ban8/bwckctlg.p_disp_listcrse?term_in=201516&subj_in=MCHT&crse_in=1011&schd_in=%25',
// 			'or', ['https://google.com/pls/ban8/bwckctlg.p_disp_listcrse?term_in=201516&subj_in=MCH&crse_in=101&schd_in=%25',
// 				'and',
// 				'https://google.com/pls/ban8/bwckctlg.p_disp_listcrse?term_in=201516&subj_in=MCHT&crse_in=1012&schd_in=%25'
// 			],
// 			'or',
// 			'https://google.com/pls/ban8/bwckctlg.p_disp_listcrse?term_in=201516&subj_in=MCHT&crse_in=1012&schd_in=%25',
// 			'or',
// 			'link here'
// 		]);
// });


// it('removeBlacklistedStrings', function () {


// 	expect(ellucianRequisitesParser.removeBlacklistedStrings({
// 		type: 'and',
// 		values: [
// 			'hi', 'Pre-req for Math 015 1'
// 		]
// 	})).toEqual({
// 		type: 'and',
// 		values: ['hi']
// 	})

// });



it('works with ))', function (done) {


	fs.readFile(path.join(__dirname, 'data', 'ellucianRequisitesParser', '1.html'), 'utf8', function (err, body) {
		expect(err).toBe(null);

		var url = 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201555&subj_code_in=PMC&crse_numb_in=6212'

		var pageData = PageData.create({
			dbData: {
				url: url
			}
		});


		request.handleRequestResponce(body, function (err, dom) {
			expect(err).toBe(null);

			var prereqs = ellucianRequisitesParser.parseRequirementSection(pageData, dom[0].children, 'prerequisites');

			expect(prereqs).toEqual({
				"type": "or",
				"values": [{
					"classId": "6000",
					"subject": "PJM"
				}, {
					"type": "and",
					"values": [{
						"classId": "6210",
						"subject": "BTC"
					}, {
						"classId": "6100",
						"subject": "RGA"
					}, {
						"type": "or",
						"values": [{
							"classId": "6201",
							"subject": "RGA"
						}, {
							"classId": "6202",
							"subject": "RGA"
						}]
					}]
				}]
			})
			done()
		})
	});
});


// note that this site has a lot of options for classes to take under the catalog listing and then only 3 under the section page
it('works with a ton of ors', function (done) {


	fs.readFile(path.join(__dirname, 'data', 'ellucianRequisitesParser', '2.html'), 'utf8', function (err, body) {
		expect(err).toBe(null);

		var url = 'https://myswat.swarthmore.edu/pls/bwckctlg.p_disp_course_detail?cat_term_in=201604&subj_code_in=MATH&crse_numb_in=033'

		var pageData = PageData.create({
			dbData: {
				url: url
			}
		});

		request.handleRequestResponce(body, function (err, dom) {
			expect(err).toBe(null);

			var prereqs = ellucianRequisitesParser.parseRequirementSection(pageData, dom[0].children, 'prerequisites');

			macros.log(prereqs);

			expect(prereqs).toEqual(Object({
				type: 'or',
				values: [Object({
					classId: '025',
					subject: 'MATH'
				}), Object({
					classId: '006S',
					subject: 'MATH'
				}), Object({
					classId: '006A',
					subject: 'MATH'
				}), Object({
					classId: '006B',
					subject: 'MATH'
				}), Object({
					classId: '006C',
					subject: 'MATH'
				}), Object({
					classId: '006D',
					subject: 'MATH'
				}), Object({
					classId: '025S',
					subject: 'MATH'
				}), Object({
					classId: '026',
					subject: 'MATH'
				})]
			}))
			done()
		})
	});
});

// it('removeBlacklistedStrings should work', function () {
// 	var a = ellucianRequisitesParser.removeBlacklistedStrings({
// 		values: ['Pre-req for Math 033 1', 'Pre-req for Math 025S 1', 'hi']
// 	})
// 	macros.log(a);


// 	expect(a).toEqual({
// 		values: ['hi']
// 	})
// });



// note that this site has a lot of options for classes to take under the catalog listing and then only 3 under the section page
it('works with a ton of ors', function (done) {


	fs.readFile(path.join(__dirname, 'data', 'ellucianRequisitesParser', 'coreqs on diff lines.html'), 'utf8', function (err, body) {
		expect(err).toBe(null);

		var url = 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201710&subj_code_in=PHYS&crse_numb_in=1161'

		var pageData = PageData.create({
			dbData: {
				url: url
			}
		});

		request.handleRequestResponce(body, function (err, dom) {
			expect(err).toBe(null);

			var coreqs = ellucianRequisitesParser.parseRequirementSection(pageData, dom[0].children, 'corequisites');
			macros.log(coreqs);

			expect(coreqs).toEqual({
				type: 'and',
				values: [{
					classId: '1162',
					subject: 'PHYS'
				}, {
					classId: '1163',
					subject: 'PHYS'
				}]
			})
			done()
		})
	});
});

// note that this site has a lot of options for classes to take under the catalog listing and then only 3 under the section page
it('3 levels', function (done) {


	fs.readFile(path.join(__dirname, 'data', 'ellucianRequisitesParser', '3 levels.html'), 'utf8', function (err, body) {
		expect(err).toBe(null);

		var url = 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201660&subj_code_in=BIOE&crse_numb_in=5410'

		var pageData = PageData.create({
			dbData: {
				url: url
			}
		});

		request.handleRequestResponce(body, function (err, dom) {
			expect(err).toBe(null);

			macros.log(dom)

			var prereqs = ellucianRequisitesParser.parseRequirementSection(pageData, dom, 'prerequisites');
			macros.log(prereqs);

			expect(prereqs).toEqual(Object({
				type: 'or',
				values: [Object({
					type: 'and',
					values: [Object({
						type: 'or',
						values: [Object({
							classId: '1115',
							subject: 'BIOL'
						}), Object({
							classId: '1111',
							subject: 'BIOL'
						})]
					}), Object({
						classId: '1342',
						subject: 'MATH'
					}), Object({
						classId: '2311',
						subject: 'CHEM'
					})]
				}), 'Graduate Admission REQ']
			}))
			done()
		})
	});
});


// Unsure exacly how we should handle this case. 
// it('mismatched_dividers', function (done) {

// 	fs.readFile('backend/parsers/tests/data/ellucianRequisitesParser/mismatched_dividers.html', 'utf8', function (err, body) {
// 		expect(err).toBe(null);

// 		var url = 'https://oscar.gatech.edu/pls/bprod/bwckctlg.p_disp_course_detail?cat_term_in=201605&subj_code_in=APPH&crse_numb_in=4238'

// 		var pageData = PageData.create({
// 			dbData: {
// 				url: url
// 			}
// 		});

// 		request.handleRequestResponce(body, function (err, dom) {
// 			expect(err).toBe(null);

// 			macros.log(dom) 
// 			debugger

// 			var prereqs = ellucianRequisitesParser.parseRequirementSection(pageData, dom, 'prerequisites');
// 			macros.log(prereqs);

// 			expect(prereqs).toEqual(Object({
// 				type: 'or', 
// 				values: [Object({
// 					type: 'and',
// 					values: [Object({
// 						type: 'or',
// 						values: [Object({
// 							classId: '1115', 
// 							subject: 'BIOL' 
// 						}), Object({
// 							classId: '1111',
// 							subject: 'BIOL'
// 						})]
// 					}), Object({  
// 						classId: '1342',
// 						subject: 'MATH'
// 					}), Object({
// 						classId: '2311', 
// 						subject: 'CHEM'
// 					})]
// 				}), 'Graduate Admission REQ'] 
// 			}))
// 			done() 
// 		})
// 	});
// });
