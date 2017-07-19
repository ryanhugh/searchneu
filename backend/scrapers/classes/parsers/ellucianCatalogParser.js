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

import URI from 'urijs';
import domutils from 'domutils';
import he from 'he';
import _ from 'lodash';
import cheerio from 'cheerio';


import cache from '../../cache';
import macros from '../../../macros';
import Request from '../../request';

var EllucianBaseParser = require('./ellucianBaseParser').EllucianBaseParser;
var ellucianClassParser = require('./ellucianClassParser');
var ellucianRequisitesParser = require('./ellucianRequisitesParser');
var ellucianRequisitesParser2 = require('./ellucianRequisitesParser2');


const request = new Request('EllucianCatalogParser');

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


// 
EllucianCatalogParser.prototype.main = async function(url) {

  // Possibly load from DEV
  if (macros.DEV && require.main !== module) {
    const devData = await cache.get('dev_data', this.constructor.name, url);
    if (devData) {
      return devData;
    }
  }

  let resp = await request.get(url);

  let retVal = await this.parse(resp.body, url)

 // Possibly save to dev
  if (macros.DEV && require.main !== module) {
    await cache.set('dev_data', this.constructor.name, url, retVal);

    // Don't log anything because there would just be too much logging. 
  }

  return retVal

};


EllucianCatalogParser.prototype.parseClass = function (element, url) {


	let {termId, classId, subject} = this.parseCatalogUrl(url);


	var depData = {
		desc: '',
		classId: classId
	};



	depData.prettyUrl = url

	//get the class name
	var value = domutils.getText(element);

	var match = value.match(/.+?\s-\s*(.+)/i);
	if (!match || match.length < 2 || match[1].length < 2) {
		macros.error('could not find title!', match, value, url);
		return;
	}
	depData.name = this.standardizeClassName(match[1]);


	//find the box below this row
	var descTR = element.parent.next
	while (descTR.type != 'tag') {
		descTR = descTR.next;
	}
	var rows = domutils.getElementsByTagName('td', descTR)
	if (rows.length != 1) {
		macros.error('td rows !=1??', depData.classId, url);
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
		macros.log('warning, nothing matchied credits', url, text);
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
	depData.url = this.createClassURL(url, termId, subject, classId);
	if (!depData.url) {
		macros.log('error could not create class url', depData);
		return;
	}

	let fakePageData = {
		dbData: {
			url: url,
			termId: termId
		}
	}

	//find co and pre reqs and restrictions
	var prereqs = ellucianRequisitesParser.parseRequirementSection(fakePageData, element.children, 'prerequisites');
	if (prereqs) {
		depData.prereqs = prereqs;
	}

	var coreqs = ellucianRequisitesParser.parseRequirementSection(fakePageData, element.children, 'corequisites');
	if (coreqs) {
		depData.coreqs = coreqs;
	}
	
	//find co and pre reqs and restrictions
	var prereqs2 = ellucianRequisitesParser2.parseRequirementSection(fakePageData, element.children, 'prerequisites');
	if (!_.isEqual(prereqs, prereqs2)) {
		macros.log("WARNING: prereqs parsed by the new parser are not equal", JSON.stringify(prereqs, null, 4), JSON.stringify(prereqs2, null, 4))
	}

	var coreqs2 = ellucianRequisitesParser2.parseRequirementSection(fakePageData, element.children, 'corequisites');
	if (!_.isEqual(coreqs, coreqs2)) {
		macros.log("WARNING: coreqs parsed by the new parser are not equal", JSON.stringify(coreqs, null, 4), JSON.stringify(coreqs2, null, 4))
	}

	console.log(depData)

	// var dep = pageData.addDep(depData);
	// dep.setParser(ellucianClassParser)
};


EllucianCatalogParser.prototype.parse = function (body, url) {

	// Parse the dom
	const $ = cheerio.load(body);

	let elements = $('td.nttitle')

	let matchingElement;

	for (var i = 0; i < elements.length; i++) {
		let currElement = elements[i];

		if (matchingElement) {
			macros.error("Already have a matching element", elements, elements.length)
		}

		if (currElement.parent.parent.attribs.summary.includes('term')) {
			matchingElement = currElement;
		}
	}


	this.parseClass(matchingElement, url);
};







EllucianCatalogParser.prototype.EllucianCatalogParser = EllucianCatalogParser;
module.exports = new EllucianCatalogParser();


function testFunc() {
	module.exports.main('https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201810&subj_code_in=FINA&crse_numb_in=6283')
}


if (require.main === module) {
	testFunc()
	// module.exports.tests();
}
