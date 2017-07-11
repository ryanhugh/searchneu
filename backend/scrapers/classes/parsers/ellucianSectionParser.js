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

import macros from '../../../macros';

var domutils = require('domutils');
var fs = require('fs');
var he = require('he');
var URI = require('urijs');
var _ = require('lodash');


var EllucianBaseParser = require('./ellucianBaseParser').EllucianBaseParser;
var ellucianRequisitesParser = require('./ellucianRequisitesParser');
var ellucianRequisitesParser2 = require('./ellucianRequisitesParser2');

//700+ college sites use this poor interface for their registration
//good thing tho, is that it is easily scrape-able and does not require login to access seats available


function EllucianSectionParser() {
	EllucianBaseParser.prototype.constructor.apply(this, arguments);

	this.name = 'EllucianSectionParser';

	this.requiredAttrs = [
		"seatsCapacity",
		"seatsRemaining"
	];

	//minCredits and maxCredits are optional
}

//prototype constructor
EllucianSectionParser.prototype = Object.create(EllucianBaseParser.prototype);
EllucianSectionParser.prototype.constructor = EllucianSectionParser;



EllucianSectionParser.prototype.supportsPage = function (url) {
	return url.indexOf('bwckschd.p_disp_detail_sched') > -1;
};

EllucianSectionParser.prototype.getDataType = function (pageData) {
	return 'sections';
};



EllucianSectionParser.prototype.parseElement = function (pageData, element) {
	if (element.type != 'tag') {
		return;
	}

	if (element.name == 'table' && element.attribs.class == 'datadisplaytable' && element.parent.name == 'td' && element.attribs.summary.includes("seating")) {
		var tableData = this.parseTable(element);

		if (!tableData || tableData._rowCount === 0 || !tableData.capacity || !tableData.actual || !tableData.remaining) {
			elog('ERROR: invalid table in section parser', tableData, pageData.dbData.url);
			return;
		}

		//dont need to store all 3, if can determine the 3rd from the other 2 (yay math)
		var seatsCapacity = parseInt(tableData.capacity[0]);
		var seatsActual = parseInt(tableData.actual[0]);
		var seatsRemaining = parseInt(tableData.remaining[0]);

		if (seatsActual + seatsRemaining != seatsCapacity) {
			macros.log('warning, actual + remaining != capacity', seatsCapacity, seatsActual, seatsRemaining, pageData.dbData.url);

			// Oddly enough, sometimes this check fails.
			// In this case, use the greater number for capacity
			// https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201630&crn_in=31813
			// https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201630&crn_in=38114
			if (seatsCapacity < seatsActual + seatsRemaining) {
				seatsCapacity = seatsActual + seatsRemaining;
			}
		}

		pageData.setData('seatsCapacity', seatsCapacity);
		pageData.setData('seatsRemaining', seatsRemaining);


		if (tableData._rowCount > 1) {

			var waitCapacity = parseInt(tableData.capacity[1]);
			var waitActual = parseInt(tableData.actual[1]);
			var waitRemaining = parseInt(tableData.remaining[1]);

			if (waitActual + waitRemaining != waitCapacity) {
				macros.log('warning, wait actual + remaining != capacity', waitCapacity, waitActual, waitRemaining, pageData.dbData.url);

				if (waitCapacity < waitActual + waitRemaining) {
					waitCapacity = waitActual + waitRemaining;
				}
			}

			pageData.setData('waitCapacity', waitCapacity);
			pageData.setData('waitRemaining', waitRemaining);
		}


		//third row is cross list seats, rarely listed and not doing anyting with that now
		// https://ssb.ccsu.edu/pls/ssb_cPROD/bwckschd.p_disp_detail_sched?term_in=201610&crn_in=12532



		//find co and pre reqs and restrictions
		var prereqs = ellucianRequisitesParser.parseRequirementSection(pageData, element.parent.children, 'prerequisites');
		if (prereqs) {
			pageData.setParentData('prereqs', prereqs);
		}

		var coreqs = ellucianRequisitesParser.parseRequirementSection(pageData, element.parent.children, 'corequisites');
		if (coreqs) {
			pageData.setParentData('coreqs', coreqs);
		}

		//find co and pre reqs and restrictions
		var prereqs2 = ellucianRequisitesParser2.parseRequirementSection(pageData, element.parent.children, 'prerequisites');
		if (!_.isEqual(prereqs, prereqs2)) {
			macros.log("WARNING: prereqs parsed by the new parser are not equal", JSON.stringify(prereqs, null, 4), JSON.stringify(prereqs2, null, 4))
		}

		var coreqs2 = ellucianRequisitesParser2.parseRequirementSection(pageData, element.parent.children, 'corequisites');
		if (!_.isEqual(coreqs, coreqs2)) {
			macros.log("WARNING: coreqs parsed by the new parser are not equal", JSON.stringify(coreqs, null, 4), JSON.stringify(coreqs2, null, 4))
		}


		//grab credits
		var text = domutils.getText(element.parent).toLowerCase()
		var creditsParsed = this.parseCredits(text);

		if (creditsParsed) {
			pageData.setParentData('maxCredits', creditsParsed.maxCredits);
			pageData.setParentData('minCredits', creditsParsed.minCredits);
		}
		else {
			macros.log('warning, nothing matchied credits', pageData.dbData.url, text);
		}


		// HONORS NOTES
		// swathmore and sju have "honors" in title 
		// https://myswat.swarthmore.edu/pls/bwckschd.p_disp_detail_sched?term_in=201602&crn_in=25340
		// https://myswat.swarthmore.edu/pls/bwckctlg.p_disp_course_detail?cat_term_in=201602&subj_code_in=MATH&crse_numb_in=016H
		// https://ssb.sju.edu/pls/PRODSSB/bwckctlg.p_disp_course_detail?cat_term_in=201610&subj_code_in=CHM&crse_numb_in=126

		// clemson has Honors in attributes 
		// HOWEVER it also has a "includes honors sections" in the dsecription
		// https://sisssb.clemson.edu/sisbnprd/bwckschd.p_disp_detail_sched?term_in=201608&crn_in=87931

		// gatech has honors in title
		// neu has it in attributes, as different sections in same class
		// https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=201710&subj_in=CS&crse_in=1800&schd_in=LEC
		// 
		// TLDR: class.honors = sectionHtml.includes('honors')


		// grab honors (honours is canadian spelling)
		if (text.includes('honors') || text.includes('honours')) {
			pageData.setParentData('honors', true)
		}
		else {
			pageData.setParentData('honors', false)
		}
	}
};







//this allows subclassing, http://bites.goodeggs.com/posts/export-this/ (Mongoose section)
EllucianSectionParser.prototype.EllucianSectionParser = EllucianSectionParser;
module.exports = new EllucianSectionParser();

if (require.main === module) {
	module.exports.tests();
}
