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
var fs = require('fs');


import request from '../../request';


function BaseParser() {
	this.requiredAttrs = [];
	this.name = "BaseParser"
}

BaseParser.prototype.getDataType = function() {
	return null;
};

BaseParser.prototype.supportsPage = function () {
	return false;
};

BaseParser.prototype.getPointerConfig = function (pageData) {
	return {
		requiredInBody: this.requiredInBody
	}
};

//callback here is pageData (stuff to store in db), and metadata (stuff dont store in db)
BaseParser.prototype.parse = async function (pageData, callback) {
	let config = this.getPointerConfig(pageData)
	config.url = pageData.dbData.url

	if (config.payload) {
		config.method = 'POST'
		config.body = config.payload
	}


	let response = await request.request(config)

	request.handleRequestResponce(response.body, function(err, dom) {

		pageData.setData('lastUpdateTime', new Date().getTime());

		this.parseDOM(pageData, dom);

		callback();
	}.bind(this))
};


//html parsing helpers and common functions

BaseParser.prototype.isValidData = function (pageData) {

	//ensure that data has all of these attributes

	for (var i = 0; i < this.requiredAttrs.length; i++) {
		var attrName = this.requiredAttrs[i]
		if (pageData.getData(attrName) === undefined) {
			console.log('MISSING', attrName)
			return false;
		};
	}
	return true;
};



BaseParser.prototype.onBeginParsing = function (pageData) {

};

BaseParser.prototype.parseElement = function (pageData, element) {

};


BaseParser.prototype.onEndParsing = function (pageData) {

};

BaseParser.prototype.parseDOM = function (pageData, dom) {

	this.onBeginParsing(pageData, dom);

	domutils.findAll(this.parseElement.bind(this, pageData), dom);

	this.onEndParsing(pageData, dom);

	//missed something, or invalid page
	if (!this.isValidData(pageData)) {
		console.log("ERROR: though url was good, but missed data", pageData);
		return null;
	}


}



//returns a {colName:[values]} where colname is the first in the column
//regardless if its part of the header or the first row of the body
BaseParser.prototype.parseTable = function (table) {
	if (table.name != 'table') {
		elog('parse table was not given a table..')
		return;
	};


	//includes both header rows and body rows
	var rows = domutils.getElementsByTagName('tr', table);

	if (rows.length === 0) {
		elog('zero rows???')
		return;
	};


	var retVal = {
		_rowCount: rows.length - 1
	}
	var heads = []

	//the headers
	rows[0].children.forEach(function (element) {
		if (element.type != 'tag' || ['th', 'td'].indexOf(element.name) === -1) {
			return;
		}

		var text = domutils.getText(element).trim().toLowerCase().replace(/\s/gi, '');
		retVal[text] = []
		heads.push(text);

	}.bind(this));



	//add the other rows
	rows.slice(1).forEach(function (row) {

		var index = 0;
		row.children.forEach(function (element) {
			if (element.type != 'tag' || ['th', 'td'].indexOf(element.name) === -1) {
				return;
			}
			if (index >= heads.length) {
				console.log('warning, table row is longer than head, ignoring content', index, heads, rows);
				return;
			};

			retVal[heads[index]].push(domutils.getText(element).trim())

			//only count valid elements, not all row.children
			index++;
		}.bind(this));


		//add empty strings until reached heads length
		for (; index < heads.length; index++) {
			retVal[heads[index]].push('')
		};


	}.bind(this));
	return retVal;
};



//add inputs if they have a value = name:value
//add all select options if they have multiple
//add just the first select option if is only 1
BaseParser.prototype.parseForm = function (url, dom) {

	//find the form, bail if !=1 on the page
	var forms = domutils.getElementsByTagName('form', dom);
	if (forms.length != 1) {
		console.log('there is !=1 forms??', forms, url);
		return
	}
	var form = forms[0];

	var payloads = [];

	//inputs
	var inputs = domutils.getElementsByTagName('input', form);
	inputs.forEach(function (input) {

		if (input.attribs.name === undefined || input.attribs.type == "checkbox") {
			return;
		}

		if (input.attribs.value === undefined || input.attribs.value == '') {
			input.attribs.value = ''
		}

		payloads.push({
			name: input.attribs.name,
			value: input.attribs.value
		});
	});


	var selects = domutils.getElementsByTagName('select', form);

	selects.forEach(function (select) {

		var options = domutils.getElementsByTagName('option', select);
		if (options.length === 0) {
			console.log('warning no options in form???', url);
			return;
		}

		//add all of them
		if (select.attribs.multiple !== undefined) {

			options.forEach(function (option) {
				var text = domutils.getText(option).trim();

				payloads.push({
					value: option.attribs.value,
					text: text,
					name: select.attribs.name
				});


			}.bind(this));
		}

		//just add the first select
		else {

			var alts = [];

			options.slice(1).forEach(function (option) {
				var text = domutils.getText(option).trim();
				alts.push({
					value: option.attribs.value,
					text: text,
					name: select.attribs.name
				})
			})

			//get default option
			var text = domutils.getText(options[0]).trim();
			payloads.push({
				value: options[0].attribs.value,
				text: text,
				name: select.attribs.name,
				alts: alts
			});
		}
	});


	//parse the url, and return the url the post request should go to
	var urlParsed = new URI(url);

	return {
		postURL: urlParsed.protocol() + '://' + urlParsed.host() + form.attribs.action,
		payloads: payloads
	};
}


BaseParser.prototype.parseCredits = function (containsCreditsText) {


	//should match 3.000 Credits  or 1.000 TO 21.000 Credits
	var creditsMatch = containsCreditsText.match(/(?:(\d(:?.\d*)?)\s*to\s*)?(\d+(:?.\d*)?)\s*credit(:?s| hours)/i);
	if (creditsMatch) {
		var maxCredits = parseFloat(creditsMatch[3]);
		var minCredits;

		//sometimes a range is given,
		if (creditsMatch[1]) {
			minCredits = parseFloat(creditsMatch[1]);
		}
		else {
			minCredits = maxCredits;
		}

		if (minCredits > maxCredits) {
			console.log('error, min credits>max credits...', containsCreditsText);
			minCredits = maxCredits;
		}

		return {
			minCredits: minCredits,
			maxCredits: maxCredits
		}
	}


	//Credit Hours: 3.000
	creditsMatch = containsCreditsText.match(/credits?\s*(?:hours?)?:?\s*(\d+(:?.\d*)?)/i);
	if (creditsMatch) {

		var credits = parseFloat(creditsMatch[1]);

		return {
			minCredits: credits,
			maxCredits: credits
		}
	}

	// 0.800 Continuing Education Units 
	creditsMatch = containsCreditsText.match(/(\d+(:?.\d*)?)\s*Continuing\s*Education\s*Units/i);
	if (creditsMatch) {
		var credits = parseFloat(creditsMatch[1])

		return {
			minCredits: credits,
			maxCredits: credits
		}
	}


	return null;
}



// http://dan.hersam.com/tools/smart-quotes.html
BaseParser.prototype.simplifySymbols = function (s) {

	// Codes can be found here:
	// http://en.wikipedia.org/wiki/Windows-1252#Codepage_layout
	s = s.replace(/\u2018|\u2019|\u201A|\uFFFD/g, "'");
	s = s.replace(/\u201c|\u201d|\u201e/g, '"');
	s = s.replace(/\u02C6/g, '^');
	s = s.replace(/\u2039/g, '<');
	s = s.replace(/\u203A/g, '>');
	s = s.replace(/\u2013/g, '-');
	s = s.replace(/\u2014/g, '--');
	s = s.replace(/\u2026/g, '...');
	s = s.replace(/\u00A9/g, '(c)');
	s = s.replace(/\u00AE/g, '(r)');
	s = s.replace(/\u2122/g, 'TM');
	s = s.replace(/\u00BC/g, '1/4');
	s = s.replace(/\u00BD/g, '1/2');
	s = s.replace(/\u00BE/g, '3/4');
	s = s.replace(/[\u02DC|\u00A0]/g, " ");
	return s;
}



// no great npm module found so far
// https://www.npmjs.com/package/case
// https://www.npmjs.com/package/change-case
// https://www.npmjs.com/package/slang
// https://www.npmjs.com/package/to-title-case -- currently using this one, its ok not great
// var a = require("change-case").title

// console.log(a('texas a&m university'));
// console.log(a('something something'))
// console.log(a('2Nd year spanish'))

// Used for college names, professor names and locations
// odd cases: "TBA", Texas A&M University
BaseParser.prototype.toTitleCase = function (originalString, warningStr) {
	if (originalString === "TBA") {
		return originalString
	}

	if (originalString.toLowerCase() == originalString || originalString.toUpperCase() == originalString) {
		console.log("Warning: originalString is all upper or all lower case", originalString, warningStr);
	}


	var string = this.simplifySymbols(originalString)

	//get rid of newlines and replace large sections of whitespace with one space
	string = string.replace(/\n/g, ' ').replace(/\r/g, ' ').replace(/\s+/g, ' ');

	// string = toTitleCase(string)


	var correctParts = [
		// Texas A&M University
		' A&M ',
	]

	correctParts.forEach(function (subString) {
		string = string.replace(new RegExp(subString, 'gi'), subString);
	}.bind(this))

	string = string.trim()

	if (string != originalString.trim()) {
		console.log('Warning: changing from ', originalString, 'to', string, 'at', warningStr);
	}

	return string.trim()
};

// 'something something (hon)' -> 'something something' and ['(hon)']
BaseParser.prototype.splitEndings = function (name) {
	name = name.trim()

	var endings = [];
	// --Lab at the end is also an ending
	var match = name.match(/\-+\s*[\w\d]+$/i)
	if (match) {
		var dashEnding = match[0]

		//remove it from name
		name = name.slice(0, name.indexOf(dashEnding)).trim();

		// standardize to one dash
		while (dashEnding.startsWith('-')) {
			dashEnding = dashEnding.slice(1).trim()
		}

		endings.push('- ' + dashEnding.trim())
	}

	// remove things in parens at the end
	// Intro to the Study Engr (hon)
	while (name.endsWith(')')) {

		//find the name at the end
		var match = name.match(/\([\w\d]+\)$/i);
		if (!match) {
			break;
		}

		var subString = match[0];

		if (!name.endsWith(subString)) {
			console.log("Warning: string dosent end with match??", originalName, possibleMatches);
			break;
		}

		// remove the endings
		name = name.slice(0, name.indexOf(subString)).trim();

		if (subString.length <= 5) {
			subString = subString.toLowerCase()
		}

		endings.push(subString)
	}
	return {
		name: name,
		endings: endings
	};
};



// fixes a class name based on others that it could be an abbriation of
// also cleans up whitespace and odd characters

// dosent work for
// https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?schd_in=%25&term_in=201710&subj_in=JRNL&crse_in=1150
// Interpreting the Day’s News vs Interptng the Day's News
BaseParser.prototype.standardizeClassName = function (originalName, possibleMatches) {

	// can't do much here, it was called from category. just fix small stuff
	if (possibleMatches === undefined) {
		possibleMatches = []
	}

	// trim all inputs and replace 2+ spaces for 1
	originalName = originalName.trim().replace(/\s+/gi, ' ')
	originalName = this.simplifySymbols(originalName)

	if (originalName.lenght === 0) {
		console.log("Warning: originalName was empty or had only symbols");
		if (possibleMatches.length === 0) {
			elog('Dont have a name for a class!', originalName, possibleMatches)
			return 'Unknown class'
		}
		else {
			return possibleMatches[0]
		}
	}

	for (var i = 0; i < possibleMatches.length; i++) {
		possibleMatches[i] = possibleMatches[i].trim().replace(/\s+/gi, ' ')
		possibleMatches[i] = this.simplifySymbols(possibleMatches[i])
	}


	var name = originalName;

	var nameSplit = this.splitEndings(name)
	name = nameSplit.name;
	var endings = nameSplit.endings;

	// if input is in possible matches, done
	if (possibleMatches.includes(originalName) || possibleMatches.length === 0) {
		return (name + ' ' + endings.join(' ')).trim();
	}


	// remove symbols and whitespace, just for comparing
	// ok to mess with name from here on out, 
	// but might return originalName or possibleMatch so don't mess with them
	name = name.replace(/[^0-9a-zA-Z]/gi, '')



	// see if name is an abbrivation of the possible matches
	// eg "phys for engrs" = "Physics for Engineers"
	for (var i = 0; i < possibleMatches.length; i++) {
		var possibleMatch = this.splitEndings(possibleMatches[i]).name

		// loop through possibleMatch and name at the same time
		// and when a character matches, continue.
		// if name is an in-order subset of possible match the nameIndex will be name.length at the end
		var nameIndex = 0;
		for (var matchIndex = 0; matchIndex < possibleMatch.length; matchIndex++) {

			// done!
			if (nameIndex >= name.length) {
				break;
			}

			if (possibleMatch[matchIndex].toLowerCase() == name[nameIndex].toLowerCase()) {
				nameIndex++;
			}

		}


		// huzzah! a match!
		if (nameIndex == name.length) {

			// add the endings back on, but only if possible match dosent include them
			for (var j = 0; j < endings.length; j++) {
				if (!possibleMatch.includes(endings[j])) {
					possibleMatch += ' ' + endings[j]
					possibleMatch = possibleMatch.trim()
				}
			}

			return possibleMatch
		}
	}
	return originalName;
};



BaseParser.prototype.getOptionallyPlural = function (num) {
	if (num === 1) {
		return ''
	}
	else {
		return 's'
	}
};





BaseParser.prototype.BaseParser = BaseParser;
module.exports = new BaseParser();

if (require.main === module) {
	module.exports.tests();
}
