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

import request from '../../../request'
import path from 'path'

var ellucianCatalogParser = require('../ellucianCatalogParser')
var ellucianClassParser = require('../ellucianClassParser')
var ellucianClassListParser = require('../ellucianClassListParser')
var PageData = require('../../PageData')
var fs = require('fs')
var URI = require('urijs')

it('should behave...', function(done) {
	
	fs.readFile(path.join(__dirname, 'data', 'ellucianClassListParser', '2.html'), 'utf8', function (err, body) {
		expect(err).toBe(null);

		request.handleRequestResponce(body, function (err, dom) {
			expect(err).toBe(null);

			var url = 'https://bannerweb.upstate.edu/isis/bwckctlg.p_display_courses?term_in=201580&one_subj=MDCN&sel_crse_strt=2064&sel_crse_end=2064&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr=';

			var catalogURL = "https://bannerweb.upstate.edu/isis/bwckctlg.p_disp_course_detail?cat_term_in=201580&subj_code_in=MDCN&crse_numb_in=2064";

			expect(true).toBe(ellucianClassListParser.supportsPage(url));

			var pageData = PageData.create({
				dbData: {
					url: url,
					subject: 'MATH',
					termId: '201504'
				}
			});

			ellucianClassListParser.parseDOM(pageData, dom);

			expect(pageData.deps.length).toBe(1);
			expect(pageData.deps[0].dbData.url).toBe(catalogURL)
			done()
		});
	});
}); 