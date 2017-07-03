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
import macros from '../../../macros';
var domutils = require('domutils');
var fs = require('fs');
var he = require('he');
var URI = require('urijs');
var _ = require('lodash');

var EllucianBaseParser = require('./ellucianBaseParser').EllucianBaseParser;

// This is the old requisite parser. See ellucianRequisiteParser2.js for the new one. 
// Right now both run every time a requisite section is parsed. The new one supports mismatched parens and this one does not.


function EllucianRequisitesParser() {
	EllucianBaseParser.prototype.constructor.apply(this, arguments);

	this.name = 'EllucianRequisitesParser';
}

//prototype constructor
EllucianRequisitesParser.prototype = Object.create(EllucianBaseParser.prototype);
EllucianRequisitesParser.prototype.constructor = EllucianRequisitesParser;



EllucianRequisitesParser.prototype.supportsPage = function (url) {
	return false;
};


//follow the order of operations (and before or)
//and group a (something and something or something) to ((something and something) or something)
//unnecesary groupings are undone by simplifyRequirements
EllucianRequisitesParser.prototype.groupRequirementsByAnd = function (data) {
	var retVal = [];

	for (var i = 0; i < data.length; i++) {
		if (i + 2 >= data.length) {
			retVal.push(data[i]);
			continue;
		}

		if (data[i + 1] == 'and' && data.length > 3) {
			var beforeAnd;
			if (Array.isArray(data[i])) {
				beforeAnd = this.groupRequirementsByAnd(data[i]);
			}
			else {
				beforeAnd = data[i];
			}

			var afterAnd;
			if (Array.isArray(data[i + 2])) {
				afterAnd = this.groupRequirementsByAnd(data[i + 2]);
			}
			else {
				afterAnd = data[i + 2];
			}

			retVal.push([beforeAnd, 'and', afterAnd]);
			i += 2;
			continue;
		}
		else {
			retVal.push(data[i]);
		}
	}
	return retVal;
};



//this is given the output of formatRequirements, where data.type and data.values exist
// if there is an or embedded in another or, merge them (and and's too)
//and if there is a subvalue of only 1 len, merge that too
EllucianRequisitesParser.prototype.simplifyRequirementsBase = function (data) {
	if ((typeof data) === 'string') {
		return data;
	}

	if (data.subject && (data.classId || data.classUid)) {
		return data;
	}

	// Must have .values and .type from here on
	var retVal = {
		type: data.type,
		values: []
	};

	// Simplify all children
	data.values.forEach(function (subData) {
		subData = this.simplifyRequirementsBase(subData);

		if (subData.type && subData.values) {

			//if same type, merge
			if (subData.type == data.type) {
				retVal.values = retVal.values.concat(subData.values);
				return;
			}

			//if only contains 1 value, merge
			else if (subData.values.length == 1) {
				retVal.values.push(subData.values[0]);
				return;
			}
		}

		//just add the subdata
		retVal.values.push(subData);
	}.bind(this))

	// Simplify this node
	if (retVal.values.length === 1) {
		return retVal.values[0];
	}

	return retVal;
};


EllucianRequisitesParser.prototype.simplifyRequirements = function (data) {
	data = this.simplifyRequirementsBase(data);
	if (!data.values || !data.type) {
		return {
			type: 'or',
			values: [data]
		}
	}
	else {
		return data
	}
}



//converts the ['','and',''] to {type:and,values:'',''}
EllucianRequisitesParser.prototype.formatRequirements = function (data) {
	var retVal = {
		type: 'and',
		values: []
	};

	data.forEach(function (val, index) {
		if (Array.isArray(val)) {

			var subValues = this.formatRequirements(val);

			//found another array, convert sub array and add it to retval
			if (!subValues) {
				console.log('warning could not parse sub values', data, val);
			}
			else {
				retVal.values.push(subValues);
			}
		}
		else if (val == 'or' || val == 'and') {
			if (index === 0) {
				console.log('warning, divider found at index 0??', data);
			}
			retVal.type = val;
		}
		else {
			retVal.values.push(val);
		}
	}.bind(this));

	if (retVal.values.length === 0) {
		return null;
	}

	return retVal;
};


//splits a string by and/or and to json string (uparsed)
EllucianRequisitesParser.prototype.convertStringToJSON = function (text) {

	text = text.replace(/[\n\r\s]+/gi, ' ')

	var elements = [];

	//split the string by dividers " and " and " or "
	text.split(' or ').forEach(function (splitByOr, index, arr) {
		splitByOr.split(' and ').forEach(function (splitByAnd, index, arr) {
			elements.push(splitByAnd);
			if (index != arr.length - 1) {
				elements.push('and');
			}
		}.bind(this));

		if (index != arr.length - 1) {
			elements.push('or');
		}
	}.bind(this));

	var retVal = [];

	//convert the elements to a json parsable string
	//each element has quotes put around it, and comma after it
	elements.forEach(function (element) {
		//just put quotes around the dividers
		if (element == 'and' || element == 'or') {
			retVal.push('"' + element + '",');
			return;
		}
		element = element.trim();

		//all of the grouping parens will be at end or start of element string
		while (element.startsWith('(')) {
			element = element.slice(1).trim();
			retVal.push('[');
		}

		//ending bracket needs to be checked here, but inserted after url/text parsed
		// https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201615&subj_code_in=BTC&crse_numb_in=6213
		var endBracketToInsertCount = 0;
		while (element.endsWith(')')) {
			element = element.slice(0, element.length - 1).trim();
			endBracketToInsertCount++;
		}


		//match the url if it is there
		var match = element.match(/\@\#\$"(.*?)"/i);
		if (element.includes('@#$') && match) {
			retVal.push('"@#$' + match[1] + '",');
		}
		//just add all of the text
		else {
			retVal.push('"' + element.trim() + '",');
		}

		for (var i = 0; i < endBracketToInsertCount; i++) {
			retVal.push('],');
		}


	}.bind(this));

	//clean up invalid syntax
	var retValText = '[' + retVal.join("") + ']';
	retValText = retValText.replace(/,\]/gi, ']').replace(/\[,/gi, '[').replace(/",+"/gi, '","').replace(/\n|\r/gi, '');

	return retValText;
};

EllucianRequisitesParser.prototype.removeBlacklistedStrings = function (data) {
	if (!data.values) {
		console.log('js error need values in removeBlacklistedStrings')
		return data
	};

	var newValues = [];

	data.values.forEach(function (subData) {
		if ((typeof subData) == 'string') {
			if (!subData.match(/\s*Pre-?req for \w+\s*[\d\w]+\s*\d+\s*$/gi)) {
				newValues.push(subData)
			}
		}
		else {
			newValues.push(this.removeBlacklistedStrings(subData))
		}
	}.bind(this));

	data.values = newValues;

	return data;

};

EllucianRequisitesParser.prototype.convertClassListURLs = function (pageData, data) {
	if ((typeof data) == 'string') {

		//urls will start with this
		if (data.startsWith('@#$')) {
			var classInfo = this.classListURLtoClassInfo(data.slice(3));
			if (!classInfo) {
				console.log('error thought was url, but wasent', data);
				return data;
			}

			//don't need to keep termId if its the same as this class
			if (classInfo.termId === pageData.dbData.termId) {
				delete classInfo.termId;
			};


			return classInfo;
		}
		else {
			return data;
		}
	}
	else {
		data.values.forEach(function (subData, index) {
			data.values[index] = this.convertClassListURLs(pageData, subData);
		}.bind(this));
		return data;
	}
};


EllucianRequisitesParser.prototype.parseRequirementSection = function (pageData, classDetails, sectionName) {
	var elements = [];
	var i = 0;

	//skip all elements until the section
	for (; i < classDetails.length; i++) {
		if (classDetails[i].type == 'tag' && domutils.getText(classDetails[i]).trim().toLowerCase().includes(sectionName)) {
			break;
		}
	}
	i++;

	//add all text/elements until next element
	for (; i < classDetails.length; i++) {
		if (classDetails[i].type == 'tag') {
			if (classDetails[i].name == 'br') {
				if (elements.length > 0) {
					elements.push(' and ')
				}
				continue;
			}
			else if (classDetails[i].name == 'a') {

				var elementText = domutils.getText(classDetails[i]);
				if (elementText.trim() === '') {
					macros.verbose('warning, not matching ', sectionName, ' with no text in the link', pageData.dbData.url);
					continue;
				}

				var classListUrl = he.decode(classDetails[i].attribs.href);
				if (!classListUrl || classListUrl === '') {
					console.log('error could not get classListUrl', classListUrl, classDetails[i].attribs, pageData.dbData.url);
					continue;
				}

				classListUrl = new URI(classListUrl).absoluteTo(pageData.dbData.url).toString();
				if (!classListUrl) {
					console.log('error could not find classListUrl url', classListUrl, classDetails[i], classDetails[i].attribs.href);
					continue;
				};

				elements.push('@#$"' + classListUrl + '"');
			}
			else {
				break;
			}
		}
		else {
			var urlText = domutils.getOuterHTML(classDetails[i]);
			urlText = urlText.replace(/\n|\r|\s/gi, ' ').replace(/\s+/gi, ' ')
			if (urlText === '' || urlText == ' ') {
				continue;
			}
			if (urlText.includes('@#$')) {
				console.log('warning @#$ used to designate url was found in string?!?', pageData.dbData.url);
				urlText = urlText.replace(/\@\#\$/gi, '');
			}
			elements.push(urlText);
		}
	}

	// Remove all the 'and's from the end that were added from replacing BRs
	for (var i = elements.length - 1; i >= 0; i--) {
		if (elements[i] == ' and ') {
			elements.splice(i)
		}
		else {
			break;
		}
	}

	//no section given, or invalid section, or page does not list any pre/co reqs
	if (elements.length === 0) {
		return;
	}

	// console.log(elements);

	var text = elements.join("").trim();
	if (text === '') {
		console.log('warning, found elements, but no links or and or', elements);
		return;
	}
	text = this.convertStringToJSON(text);

	//parse the new json
	try {
		text = JSON.parse(text);
	}
	catch (err) {


		//maybe there are more starting than ending...
		var openingBrackedCount = (text.match(/\[/g) || []).length;
		var closingBrackedCount = (text.match(/\]/g) || []).length;

		if (openingBrackedCount > closingBrackedCount && text.startsWith('[')) {
			text = text.slice(1);
			try {
				text = JSON.parse(text);
			}
			catch (err) {
				console.log('error, tried to remove [ from beginning, didnt work', text, elements);
				return;
			}

		}
		else if (closingBrackedCount > openingBrackedCount && text.endsWith(']')) {
			text = text.slice(0, text.length - 1);
			try {
				text = JSON.parse(text);
			}
			catch (err) {
				console.log('error, tried to remove ] from end, didnt work', text, elements);
				return;
			}
		}
		else {

			console.log('ERROR: unabled to parse formed json string', err, text, elements, pageData.dbData.url);
			return;
		}
	}

	if (text.length == 1 && Array.isArray(text[0])) {
		text = text[0];
	}



	text = this.groupRequirementsByAnd(text);

	text = this.formatRequirements(text);
	if (!text) {
		console.log('error formatting requirements, ', pageData.dbData.url, elements);
		return;
	}
	text = this.removeBlacklistedStrings(text);
	text = this.simplifyRequirements(text);
	text = this.convertClassListURLs(pageData, text);

	return text;
};




//this allows subclassing, http://bites.goodeggs.com/posts/export-this/ (Mongoose section)
EllucianRequisitesParser.prototype.EllucianRequisitesParser = EllucianRequisitesParser;
module.exports = new EllucianRequisitesParser();

if (require.main === module) {
	module.exports.tests();
}
