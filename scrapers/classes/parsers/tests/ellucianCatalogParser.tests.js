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

 var ellucianCatalogParser = require('../ellucianCatalogParser')
var ellucianClassParser = require('../ellucianClassParser')
var PageData = require('../../PageData')
var MockPageData = require('../../MockPageData')
var fs = require('fs')
var pointer = require('../../pointer')
var URI = require('urijs')




it('parse DESCRIPTION', function (done) {


	fs.readFile('backend/parsers/tests/data/ellucianCatalogParser/5.html', 'utf8', function (err, body) {
		expect(err).toBe(null);

		pointer.handleRequestResponce(body, function (err, dom) {
			expect(err).toBe(null);

			var url = 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201610&subj_code_in=MATH&crse_numb_in=2331';

			var classURL = "https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=201610&subj_in=MATH&crse_in=2331&schd_in=%25";


			expect(true).toBe(ellucianCatalogParser.supportsPage(url));

			var pageData = PageData.create({
				dbData: {
					url: url,
					subject: 'MATH',
					termId: '201610'
				}
			});

			ellucianCatalogParser.parseDOM(pageData, dom);

			expect(pageData.deps.length).toBe(1);
			expect(pageData.deps[0].dbData.desc).toBe('Uses the Gauss-Jordan elimination algorithm to analyze and find bases for subspaces such as the image and kernel of a linear transformation. Covers the geometry of linear transformations: orthogonality, the Gram-Schmidt process, rotation matrices, and least squares fit. Examines diagonalization and similarity, and the spectral theorem and the singular value decomposition. Is primarily for math and science majors; applications are drawn from many technical fields. Computation is aided by the use of software such as Maple or MATLAB, and graphing calculators. Prereq. MATH 1242, MATH 1252, MATH 1342, or CS 2800. 4.000 Lecture hours', pageData.deps[0].dbData.desc)
			expect(pageData.deps[0].dbData.classId).toBe('2331');
			expect(new URI(pageData.deps[0].dbData.url).equals(new URI(classURL))).toBe(true);
			done()

		});
	});
});

it('can add to existing dep', function(done) {
	
	fs.readFile('backend/parsers/tests/data/ellucianCatalogParser/1.html', 'utf8', function (err, body) {
		expect(err).toBe(null);
		pointer.handleRequestResponce(body, function (err, dom) {
			expect(err).toBe(null);


			var url = 'https://ssb.ccsu.edu/pls/ssb_cPROD/bwckctlg.p_disp_course_detail?cat_term_in=201503&subj_code_in=AIRF&crse_numb_in=522';

			var classURL = "https://ssb.ccsu.edu/pls/ssb_cPROD/bwckctlg.p_disp_listcrse?term_in=201503&subj_in=AIRF&crse_in=522&schd_in=%25";


			expect(true).toBe(ellucianCatalogParser.supportsPage(url));

			var pageData = PageData.create({
				dbData: {
					url: url,
					subject: 'AIRF',
					termId: '201503'
				}
			});

			//add a dep to test updating deps
			pageData.deps = [PageData.create({
				dbData: {
					url: classURL,
				}
			})];
			pageData.deps[0].parser = ellucianClassParser


			ellucianCatalogParser.parseDOM(pageData, dom);

			expect(pageData.deps.length, 1);


			expect(pageData.deps[0].dbData.desc).toBe("Topics in Poetry and Prosody Irregular Prereqs.: None Detailed and systematic study of poetic form, including versification, rhetorical tropes, diction, and tone. May be organized by period, subject matter, genre, or critical method. May be repeated with different topics for up to 6 credits. 3.000 Lecture hours", pageData.deps[0].dbData.desc);
			expect(pageData.deps[0].dbData.url).toBe(classURL);
			expect(new URI(pageData.deps[0].dbData.url).equals(new URI(classURL))).toBe(true)
			expect(pageData.deps[0].dbData.classId).toBe("522");
			expect(pageData.deps[0].dbData.prettyUrl).toBe(url);
			expect(new URI(pageData.deps[0].dbData.prettyUrl).equals(new URI(url))).toBe(true);
			done()


		});
	});
});


it('can parse desc', function(done) {
	

	fs.readFile('backend/parsers/tests/data/ellucianCatalogParser/2.html', 'utf8', function (err, body) {
		expect(err).toBe(null);

		pointer.handleRequestResponce(body, function (err, dom) {
			expect(err).toBe(null);

			var url = 'https://bannerweb.upstate.edu/isis/bwckctlg.p_disp_course_detail?cat_term_in=201580&subj_code_in=MDCN&crse_numb_in=2064';

			var classURL = "https://bannerweb.upstate.edu/isis/bwckctlg.p_disp_listcrse?term_in=201580&subj_in=MDCN&crse_in=2064&schd_in=%25";


			expect(true).toBe(ellucianCatalogParser.supportsPage(url));

			var pageData = PageData.create({
				dbData: {
					url: url,
					subject: 'MDCN',
					termId: '201580'
				}
			});

			ellucianCatalogParser.parseDOM(pageData, dom);

			expect(pageData.deps.length).toBe(1);
			expect(pageData.deps[0].dbData.desc).toBe('ELECTIVE DESCRIPTION: Physical exams are provided to newly resettled refugees by care teams comprised of students, residents, and faculty physicians. For many refugees, the care is their first encounter with mainstream medicine. MS-2 coordinators manage clinic operations while MS 1-4 volunteers provide the care service and gain experience in physical exam skills and cross-cultural communication. 0.000 Lab hours');
			expect(pageData.deps[0].dbData.classId).toBe("2064");

			expect(new URI(pageData.deps[0].dbData.url).equals(new URI('https://bannerweb.upstate.edu/isis/bwckctlg.p_disp_listcrse?term_in=201580&subj_in=MDCN&crse_in=2064&schd_in=%25'))).toBe(true);
			done()
		});
	});

});

it('should behave...', function(done) {
	

	fs.readFile('backend/parsers/tests/data/ellucianCatalogParser/3.html', 'utf8', function (err, body) {
		expect(err).toBe(null);

		pointer.handleRequestResponce(body, function (err, dom) {
			expect(err).toBe(null);

			var url = 'https://genisys.regent.edu/pls/prod/bwckctlg.p_disp_course_detail?cat_term_in=201610&subj_code_in=COM&crse_numb_in=507';

			var classURL = "https://genisys.regent.edu/pls/prod/bwckctlg.p_disp_listcrse?term_in=201610&subj_in=COM&crse_in=507&schd_in=%25";


			expect(true, ellucianCatalogParser.supportsPage(url));

			var pageData = PageData.create({
				dbData: {
					url: url,
					subject: 'COM',
					termId: '201610'
				}
			});

			ellucianCatalogParser.parseDOM(pageData, dom);


			expect(pageData.deps.length, 1);
			expect(pageData.deps[0].dbData.desc, 'Current internet, social media, and mobile media marketing theories , strategies, tools and practices. Includes study of communication methods used by professionals in journalism, film, television, advertising, public relations, and related professions to brand, promote, and distribute products and services. Web-based production lab included. Cross-listed with JRN 507.', pageData.deps[0].dbData.desc)
			expect(pageData.deps[0].dbData.classId, '507');
			expect(new URI(pageData.deps[0].dbData.url).equals(new URI(classURL)), true, 'classurl != depData url!');
			done()
		});
	});

});
