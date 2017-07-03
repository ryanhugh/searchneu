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

var URI = require('urijs');
var fs = require('fs');

var EllucianBaseParser = require('./ellucianBaseParser').EllucianBaseParser;
var ellucianClassListParser = require('./ellucianClassListParser');


function EllucianSubjectParser() {
	EllucianBaseParser.prototype.constructor.apply(this, arguments);
	this.name = "EllucianSubjectParser";
}


//prototype constructor
EllucianSubjectParser.prototype = Object.create(EllucianBaseParser.prototype);
EllucianSubjectParser.prototype.constructor = EllucianSubjectParser;


EllucianSubjectParser.prototype.supportsPage = function (url) {
	return url.indexOf('bwckgens.p_proc_term_date') > -1;
};

EllucianSubjectParser.prototype.getDataType = function (pageData) {

	// Return null if it is the controller.
	if (pageData.dbData.subject) {
		return 'subjects';
	}
	else {
		return null;
	}
};

EllucianSubjectParser.prototype.getPointerConfig = function (pageData) {
	var config = EllucianBaseParser.prototype.getPointerConfig.apply(this, arguments);
	if (!pageData.dbData.termId) {
		elog('in pointer config and dont have termId!!!');
	}

	config.payload = 'p_calling_proc=bwckschd.p_disp_dyn_sched&p_term=' + pageData.dbData.termId
	config.headers = {
		'Content-Type': 'application/x-www-form-urlencoded'
	}
	return config;
};



EllucianSubjectParser.prototype.onEndParsing = function (pageData, dom) {

	//parse the form data
	var formData = this.parseSearchPage(pageData.dbData.url, dom);
	var subjects = [];

	formData.payloads.forEach(function (payloadVar) {
		if (payloadVar.name != 'sel_subj') {
			return;
		}

		if (!payloadVar.text || payloadVar.text === '') {
			return;
		}

		if (!payloadVar.value || payloadVar.value === '') {
			return;
		}

		//record all the subjects and their id's
		if (payloadVar.name == 'sel_subj') {
			subjects.push({
				id: payloadVar.value,
				text: payloadVar.text
			});
		}
	}.bind(this));

	if (subjects.length === 0) {
		console.log('ERROR, found 0 subjects??', pageData.dbData.url);
	}



	subjects.forEach(function (subject) {


		//if it already exists, just update the description
		for (var i = 0; i < pageData.deps.length; i++) {
			if (subject.id == pageData.deps[i].dbData.subject) {
				pageData.deps[i].setData('text', subject.text);
				return;
			};
		};

		//if not, add it
		var subjectPageData = pageData.addDep({
			updatedByParent: true,
			subject: subject.id,
			text: subject.text
		});
		subjectPageData.setParser(this)


		//and add the subject dependency
		var catalogPageData = subjectPageData.addDep({
			url: this.createClassListUrl(pageData.dbData.url, pageData.dbData.termId, subject.id)
		});
		catalogPageData.setParser(ellucianClassListParser)

	}.bind(this))
};


EllucianSubjectParser.prototype.parseSearchPage = function (startingURL, dom) {


	var parsedForm = this.parseForm(startingURL, dom);

	//remove sel_subj = ''
	var payloads = [];

	//if there is an all given on the other pages, use those (and don't pick every option)
	//some sites have a limit of 2000 parameters per request, and picking every option sometimes exceeds that
	var allOptionsFound = [];

	parsedForm.payloads.forEach(function (entry) {
		if (entry.name == 'sel_subj' && entry.value == '%') {
			return;
		}
		else if (entry.value == '%') {
			allOptionsFound.push(entry.name);
		}
		payloads.push(entry);
	}.bind(this));


	var finalPayloads = [];

	//loop through again to make sure not includes any values which have an all set
	payloads.forEach(function (entry) {
		if (allOptionsFound.indexOf(entry.name) < 0 || entry.value == '%' || entry.value == 'dummy') {
			finalPayloads.push(entry);
		}
	}.bind(this));

	return {
		postURL: parsedForm.postURL,
		payloads: finalPayloads
	};
};






EllucianSubjectParser.prototype.EllucianSubjectParser = EllucianSubjectParser;
module.exports = new EllucianSubjectParser();

if (require.main === module) {
	module.exports.tests();
}
