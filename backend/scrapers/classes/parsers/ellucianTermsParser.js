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
var moment = require('moment')

import utils from '../../utils';
import request from '../../request';
var collegeNamesParser = require('./collegeNamesParser');

var EllucianBaseParser = require('./ellucianBaseParser').EllucianBaseParser;
var ellucianSubjectParser = require('./ellucianSubjectParser');


function EllucianTermsParser() {
	EllucianBaseParser.prototype.constructor.apply(this, arguments);
	this.name = "EllucianTermsParser";
}



//prototype constructor
EllucianTermsParser.prototype = Object.create(EllucianBaseParser.prototype);
EllucianTermsParser.prototype.constructor = EllucianTermsParser;



var staticHosts = [
{
	includes:'Law',
	mainHost:'neu.edu',
	title:'Northeastern University Law',
	host:'neu.edu/law'
},
{
	includes:'CPS',
	mainHost:'neu.edu',
	title:'Northeastern University CPS',
	host:'neu.edu/cps'
}]

EllucianTermsParser.prototype.getStaticHost = function(mainHost,termString) {
	
	for (var i = 0; i < staticHosts.length; i++) {
		var staticHost = staticHosts[i];
		if (staticHost.mainHost==mainHost && termString.includes(staticHost.includes)) {
			return {
				host:staticHost.host,
				text:termString.replace(staticHost.includes,'').replace(/\s+/gi,' ').trim()
			};
		};
	}
	return null;
};


EllucianTermsParser.prototype.getDataType = function (pageData) {
	return 'terms';
};


EllucianTermsParser.prototype.supportsPage = function (url) {
	return url.indexOf('bwckschd.p_disp_dyn_sched') > -1;
};


EllucianTermsParser.prototype.minYear = function () {
	return moment().subtract(4, 'months').year()
};

EllucianTermsParser.prototype.isValidTerm = function (termId, text) {

	var year = text.match(/\d{4}/);
	var minYear = this.minYear();

	if (!year) {
		utils.log('warning: could not find year for ', text);

		//if the termId starts with the >= current year, then go
		var idYear = parseInt(termId.slice(0, 4))

		//if first 4 numbers of id are within 3 years of the year that it was 4 months ago
		if (idYear + 3 > minYear && idYear - 3 < minYear) {
			return true;
		}
		else {
			return false;
		}
	}

	//skip past years
	if (parseInt(year) < minYear) {
		return false;
	}
	return true;

};

EllucianTermsParser.prototype.addCollegeName = function (pageData, host) {

	//add the college names dep, if it dosent already exist
	for (var i = 0; i < pageData.deps.length; i++) {
		var currDep = pageData.deps[i]
		if (currDep.parser == collegeNamesParser && currDep.dbData.host == host) {
			return;
		}
	}

	var newDep = pageData.addDep({
		url: host,
		host: host
	})
	newDep.setParser(collegeNamesParser)
};


EllucianTermsParser.prototype.onEndParsing = function (pageData, dom) {
	var formData = this.parseTermsPage(pageData.dbData.url, dom);
	var terms = [];

	formData.requestsData.forEach(function (singleRequestPayload) {

		//record all the terms and their id's
		singleRequestPayload.forEach(function (payloadVar) {
			if (this.shouldParseEntry(payloadVar)) {
				terms.push({
					id: payloadVar.value,
					text: payloadVar.text
				});
			}
		}.bind(this));
	}.bind(this));

	if (terms.length === 0) {
		utils.log('ERROR, found 0 terms??', pageData.dbData.url);
	};

	var host = utils.getBaseHost(pageData.dbData.url);

	if (!pageData.dbData.host) {
		pageData.dbData.host = host;
	};

	terms.forEach(function (term) {

		//calculate host for each entry
		var host = utils.getBaseHost(pageData.dbData.url);

		var newTerm = this.getStaticHost(host, term.text)
		if (newTerm) {
			host = newTerm.host
			term.text = newTerm.text
		}
		else {
			this.addCollegeName(pageData, host)
		};
		term.host = host;

		//add the shorter version of the term string
		term.shortText = term.text.replace(/Quarter|Semester/gi, '').trim()

	}.bind(this))



	pageData.parsingData.duplicateTexts = {};



	//keep track of texts, and if they are all different with some words removed
	//keep the words out
	terms.forEach(function (term) {

		if (!pageData.parsingData.duplicateTexts[term.host]) {
			pageData.parsingData.duplicateTexts[term.host] = {
				values: [],
				areAllDifferent: true
			}
		}
		if (pageData.parsingData.duplicateTexts[term.host].values.includes(term.shortText)) {
			pageData.parsingData.duplicateTexts[term.host].areAllDifferent = false;
			return;
		}
		pageData.parsingData.duplicateTexts[term.host].values.push(term.shortText)

	}.bind(this))


	//for each host, change the values if they are different
	terms.forEach(function (term) {
		if (pageData.parsingData.duplicateTexts[term.host].areAllDifferent) {
			term.text = term.shortText
		}
	}.bind(this))



	//the given page data is the controller
	//give the first term to it,
	//and pass the others in as deps + noupdate

	terms.forEach(function (term) {



		//if it already exists, just update the description
		for (var i = 0; i < pageData.deps.length; i++) {
			var currDep = pageData.deps[i]
			if (currDep.parser == this && term.id == currDep.dbData.termId) {
				currDep.setData('text', term.text);
				currDep.setData('host', term.host);
				return;
			};
		};

		utils.log("Parsing term: ", JSON.stringify(term));

		//if not, add it
		var termPageData = pageData.addDep({
			updatedByParent: true,
			termId: term.id,
			text: term.text,
			host: term.host
		});
		termPageData.setParser(this)


		//and add the subject dependency
		var subjectController = termPageData.addDep({
			url: formData.postURL
		});
		subjectController.setParser(ellucianSubjectParser)

	}.bind(this))
};


EllucianTermsParser.prototype.shouldParseEntry = function(entry) {
	if (entry.name == 'p_term'){
		return true;
	}
	else {
		return false;
	}
};



//step 1, select the terms
//starting url is the terms page
EllucianTermsParser.prototype.parseTermsPage = function (startingURL, dom) {
	var parsedForm = this.parseForm(startingURL, dom);

	if (!parsedForm) {
		elog('default form data failed');
		return;
	}

	var defaultFormData = parsedForm.payloads;


	//find the term entry and all the other entries
	var termEntry;
	var otherEntries = [];
	defaultFormData.forEach(function (entry) {
		if (this.shouldParseEntry(entry)) {
			if (termEntry) {
				elog("Already and entry???", termEntry)
			}
			termEntry = entry;
		}
		else {
			otherEntries.push(entry);
		}
	}.bind(this));

	if (!termEntry) {
		elog('Could not find an entry!', startingURL, JSON.stringify(parsedForm));
		return;
	}

	var requestsData = []; 

	//setup an indidual request for each valid entry on the form - includes the term entry and all other other entries
	termEntry.alts.forEach(function (entry) {
		if (!this.shouldParseEntry(entry)) {
			utils.log('ERROR: entry was alt of term entry but not same name?', entry);
			return;
		}
		entry.text = entry.text.trim()

		if (entry.text.toLowerCase() === 'none') {
			return;
		}
		entry.text = entry.text.replace(/\(view only\)/gi, '').trim();

		entry.text = entry.text.replace(/summer i$/gi, 'Summer 1').replace(/summer ii$/gi, 'Summer 2')

		//dont process this element on error
		if (entry.text.length < 2) {
			utils.log('warning: empty entry.text on form?', entry, startingURL);
			return;
		}

		if (!this.isValidTerm(entry.value, entry.text)) {
			return;
		}


		var fullRequestData = otherEntries.slice(0);

		fullRequestData.push({
			name: entry.name,
			value: entry.value,
			text: entry.text
		});

		requestsData.push(fullRequestData);

	}.bind(this));

	return {
		postURL: parsedForm.postURL,
		requestsData: requestsData
	};
};




EllucianTermsParser.prototype.EllucianTermsParser = EllucianTermsParser;
module.exports = new EllucianTermsParser();

if (require.main === module) {
	module.exports.tests();
}
