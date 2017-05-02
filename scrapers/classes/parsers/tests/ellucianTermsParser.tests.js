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
var ellucianTermsParser = require('../ellucianTermsParser')
var MockPageData = require('../../MockPageData')
var fs = require('fs')
var pointer = require('../../pointer')
var PageData = require('../../PageData')
var URI = require('urijs')


it('has a name', function() {
	
	//make sure a name is defined
	expect(ellucianTermsParser.name);
});

it('isValidTerm should work', function () {

	expect(ellucianTermsParser.isValidTerm('201630', 'blah blah 2016')).toBe(true)
	expect(ellucianTermsParser.isValidTerm('201630', 'blah blah 2017')).toBe(true)
	expect(ellucianTermsParser.isValidTerm('201630', 'blah blah')).toBe(true)
	expect(ellucianTermsParser.isValidTerm('2016', 'blah blah')).toBe(true)
	expect(ellucianTermsParser.isValidTerm('201', 'blah blah')).toBe(false)
});
  
it('should behave...', function (done) {

	fs.readFile('backend/parsers/tests/data/ellucianTermsParser/1.html', 'utf8', function (err, body) {
		expect(err).toBe(null);

		pointer.handleRequestResponce(body, function (err, dom) {
			expect(err).toBe(null);

			var url = 'https://bannerweb.upstate.edu/isis/bwckschd.p_disp_dyn_sched';

			var pageData = PageData.create({
				dbData: {
					url: url
				}
			});

			ellucianTermsParser.parseDOM(pageData, dom);


			expect(true).toBe(ellucianTermsParser.supportsPage(url));


			expect(pageData.deps[1].dbData.text).toBe('Spring 2017 Summer 2')
			expect(pageData.deps[1].dbData.host).toBe('upstate.edu')
			expect(pageData.deps[1].dbData.updatedByParent).toBe(true)
			expect(pageData.deps[1].dbData.termId).toBe('201611')
			done()

		});
	});
});



it('should behave...', function (done) {

	fs.readFile('backend/parsers/tests/data/ellucianTermsParser/2.html', 'utf8', function (err, body) {
		expect(err).toBe(null);

		pointer.handleRequestResponce(body, function (err, dom) {
			expect(err).toBe(null);

			var url = 'https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_dyn_sched';

			var pageData = PageData.create({
				dbData: {
					url: url
				}
			});

			ellucianTermsParser.parseDOM(pageData, dom);


			expect(true).toBe(ellucianTermsParser.supportsPage(url));

			expect(pageData.deps.length).toBe(18);
			// expect(pageData.deps[1].dbData.text).toBe('Spring 2017 Semester')
			// expect(pageData.deps[1].dbData.host).toBe('neu.edu/law')


			done()
		});
	});
});
