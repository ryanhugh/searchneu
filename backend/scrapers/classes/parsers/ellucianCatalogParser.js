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
var URI = require('urijs');
var domutils = require('domutils');
var he = require('he');
var _ = require('lodash');
import cheerio from 'cheerio';

var EllucianBaseParser = require('./ellucianBaseParser').EllucianBaseParser;
var ellucianClassParser = require('./ellucianClassParser');
var ellucianRequisitesParser = require('./ellucianRequisitesParser');
var ellucianRequisitesParser2 = require('./ellucianRequisitesParser2');


function EllucianCatalogParser() {
	EllucianBaseParser.prototype.constructor.apply(this, arguments);
	this.name = "EllucianCatalogParser"
}


//prototype constructor
EllucianCatalogParser.prototype = Object.create(EllucianBaseParser.prototype);
EllucianCatalogParser.prototype.constructor = EllucianCatalogParser;



EllucianCatalogParser.prototype.supportsPage = function (url) {
	return url.indexOf('bwckctlg.p_disp_course_detail') > -1;
}


EllucianCatalogParser.prototype.parseClass = function (pageData, element) {


	//get the classId from the url
	var catalogURLQuery = new URI(pageData.dbData.url).query(true);
	if (!catalogURLQuery.crse_numb_in) {
		console.log('error could not find Current courseId??', catalogURLQuery, pageData.dbData.url)
		return;
	}


	var depData = {
		desc: '',
		classId: catalogURLQuery.crse_numb_in
	};




	depData.prettyUrl = this.createCatalogUrl(pageData.dbData.url, pageData.dbData.termId, pageData.dbData.subject, depData.classId)

	//get the class name
	var value = domutils.getText(element);

	var match = value.match(/.+?\s-\s*(.+)/i);
	if (!match || match.length < 2 || match[1].length < 2) {
		console.log('could not find title!', match, value, pageData.dbData.url);
		return;
	}
	depData.name = this.standardizeClassName(match[1]);


	// console.log($(element.parent).getText())


	//find the box below this row
	var descTR = element.parent.next
	while (descTR.type != 'tag') {
		descTR = descTR.next;
	}
	var rows = domutils.getElementsByTagName('td', descTR)
	if (rows.length != 1) {
		console.log('td rows !=1??', depData.classId, pageData.dbData.url);
		return;
	};

	element = rows[0]


	//get credits from element.parent.text here

	//grab credits
	var text = domutils.getText(element.parent)
	var creditsParsed = this.parseCredits(text);

	if (creditsParsed) {
		depData.maxCredits = creditsParsed.maxCredits;
		depData.minCredits = creditsParsed.minCredits;
	}
	else {
		console.log('warning, nothing matchied credits', pageData.dbData.url, text);
	}


	//desc
	//list all texts between this and next element, not including <br> or <i>
	//usally stop at <span> or <p>
	for (var i = 0; i < element.children.length; i++) {
		if (element.children[i].type == 'tag' && !['i', 'br', 'a'].includes(element.children[i].name)) {
			break;
		}
		depData.desc += '  ' + domutils.getText(element.children[i]).trim();
	}

	depData.desc = depData.desc.replace(/\n|\r/gi, ' ').trim()
		//remove credit hours
		// 0.000 TO 1.000 Credit hours
	depData.desc = depData.desc.replace(/(\d+(\.\d+)?\s+TO\s+)?\d+(.\d+)?\s+credit hours/gi, '').trim();

	depData.desc = depData.desc.replace(/\s+/gi, ' ').trim()

	var invalidDescriptions = ['xml extract', 'new search'];

	if (invalidDescriptions.includes(depData.desc.trim().toLowerCase())) {
		return;
	}

	//url
	depData.url = this.createClassURL(pageData.dbData.url, pageData.dbData.termId, pageData.dbData.subject, depData.classId);
	if (!depData.url) {
		console.log('error could not create class url', depData);
		return;
	}

	//find co and pre reqs and restrictions
	var prereqs = ellucianRequisitesParser.parseRequirementSection(pageData, element.children, 'prerequisites');
	if (prereqs) {
		depData.prereqs = prereqs;
	}

	var coreqs = ellucianRequisitesParser.parseRequirementSection(pageData, element.children, 'corequisites');
	if (coreqs) {
		depData.coreqs = coreqs;
	}
	
	//find co and pre reqs and restrictions
	var prereqs2 = ellucianRequisitesParser2.parseRequirementSection(pageData, element.children, 'prerequisites');
	if (!_.isEqual(prereqs, prereqs2)) {
		console.log("WARNING: prereqs parsed by the new parser are not equal", JSON.stringify(prereqs, null, 4), JSON.stringify(prereqs2, null, 4))
	}

	var coreqs2 = ellucianRequisitesParser2.parseRequirementSection(pageData, element.children, 'corequisites');
	if (!_.isEqual(coreqs, coreqs2)) {
		console.log("WARNING: coreqs parsed by the new parser are not equal", JSON.stringify(coreqs, null, 4), JSON.stringify(coreqs2, null, 4))
	}


	//update existing dep
	for (var i = 0; i < pageData.deps.length; i++) {
		var currDep = pageData.deps[i]

		//make sure classId and parser are the same
		if (new URI(currDep.dbData.url).equals(new URI(depData.url)) && currDep.parser == ellucianClassParser) {
			for (var attrName in depData) {
				currDep.setData(attrName, depData[attrName])
			}
			return;
		}
	};


	var dep = pageData.addDep(depData);
	dep.setParser(ellucianClassParser)
};


EllucianCatalogParser.prototype.parseElement = function (pageData, element) {
	if (!pageData.dbData.termId) {
		elog('error!!! in ellucianCatalogParser but dont have a termId', pageData)
		return;
	};

	if (element.type != 'tag') {
		return;
	}


	if (element.name == 'td' && element.attribs.class == 'nttitle' && element.parent.parent.attribs.summary.includes('term')) {


		if (pageData.parsingData.foundClass) {
			elog('error found multiple classes ignoring the second one', pageData.dbData.url)
			return;
		};

		pageData.parsingData.foundClass = true


		this.parseClass(pageData, element);
	}
};







EllucianCatalogParser.prototype.EllucianCatalogParser = EllucianCatalogParser;
module.exports = new EllucianCatalogParser();

if (require.main === module) {
	module.exports.tests();
}
