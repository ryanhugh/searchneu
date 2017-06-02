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


import utils from '../../utils';

var URI = require('urijs');
var domutils = require('domutils');
var moment = require('moment');
var he = require('he');
var _ = require('lodash');
var fs = require('fs');

var EllucianBaseParser = require('./ellucianBaseParser').EllucianBaseParser;
var ellucianSectionParser = require('./ellucianSectionParser');

var timeZero = moment('0', 'h');

//700+ college sites use this poor interface for their registration
//good thing tho, is that it is easily scrapeable and does not require login to access seats avalible
function EllucianClassParser() {
	EllucianBaseParser.prototype.constructor.apply(this, arguments);

	this.requiredAttrs = [];

	this.name = 'EllucianClassParser';

	//name and deps are optional, but if there is no deps there is nowhere to parse name...


}


//prototype constructor
EllucianClassParser.prototype = Object.create(EllucianBaseParser.prototype);
EllucianClassParser.prototype.constructor = EllucianClassParser;


EllucianClassParser.prototype.supportsPage = function (url) {
	return url.indexOf('bwckctlg.p_disp_listcrse') > -1;
};


EllucianClassParser.prototype.getDataType = function (pageData) {
	return 'classes';
};




//format is min from midnight, 0 = sunday, 6= saterday
//	8:00 am - 9:05 am	MWR -> {0:[{start:248309,end:390987}],1:...}
EllucianClassParser.prototype.parseTimeStamps = function (times, days) {
	if (times.toLowerCase() == 'tba' || days == '&nbsp;') {
		return;
	}

	if ((times.match(/m|-/g) || []).length != 3) {
		utils.log('ERROR: multiple times in times', times, days);
		return false;
	}

	var retVal = {};


	var dayLetterToIndex = {
		'U': 0,
		'M': 1,
		"T": 2,
		"W": 3,
		'R': 4,
		'F': 5,
		'S': 6
	};

	for (var i = 0; i < days.length; i++) {
		var dayIndex = dayLetterToIndex[days[i]];
		if (dayIndex === undefined) {
			utils.log('ERROR: unknown letter ', days, ' !!!');
			return;
		}

		var timesMatch = times.match(/(.*?) - (.*?)$/i);

		var start = moment(timesMatch[1], "hh:mm a").diff(timeZero, 'seconds');
		var end = moment(timesMatch[2], "hh:mm a").diff(timeZero, 'seconds');

		//one day, moment shouldn't return anything more that this...
		start = start % 86400;
		end = end % 86400;

		retVal[dayIndex] = [{
			start: start,
			end: end
		}];
	}
	return retVal;
};









//this is called for each section that is found on the page
EllucianClassParser.prototype.parseClassData = function (pageData, element) {

	if (!pageData.dbData.url) {
		elog(pageData.dbData)
		utils.log(pageData)
		return;
	}


	//if different name than this class, save to new class
	var classToAddSectionTo = pageData;

	var sectionStartingData = {};


	//parse name and url
	//and make a new class if the name is different
	domutils.findAll(function (element) {
		if (!element.attribs.href) {
			return;
		}


		//find the crn from the url
		var urlParsed = new URI(he.decode(element.attribs.href));

		//add hostname + port if path is relative
		if (urlParsed.is('relative')) {
			urlParsed = urlParsed.absoluteTo(pageData.getUrlStart()).toString();
		}

		var sectionURL = urlParsed.toString();

		if (ellucianSectionParser.supportsPage(sectionURL)) {
			sectionStartingData.url = sectionURL;
		}

		//add the crn
		var sectionURLParsed = this.sectionURLtoInfo(sectionURL);
		if (!sectionURLParsed) {
			utils.log('error could not parse section url', sectionURL, pageData.dbData.url);
			return;
		};



		//also parse the name from the link
		var value = domutils.getText(element);

		//match everything before " - [crn]"
		var match = value.match('(.+?)\\s-\\s' + sectionURLParsed.crn, 'i');
		if (!match || match.length < 2) {
			utils.log('could not find title!', match, value);
			return;
		}

		var className = match[1];

		if (className == className.toLowerCase() || className == className.toUpperCase()) {
			utils.log("Warning: class name is all upper or lower case", className, pageData.dbData.url);
		}

		//get a list of all class names for the class name fixer
		var possibleClassNameMatches = []
		if (pageData.parsingData.name) {
			possibleClassNameMatches.push(pageData.parsingData.name)
		}

		if (pageData.dbData.name) {
			possibleClassNameMatches.push(pageData.dbData.name)
		}

		pageData.deps.forEach(function (dep) {
			if (dep.parser != this) {
				return;
			}

			if (!dep.dbData.name) {
				elog("ERROR, dep dosen't have a name?", pageData.deps)
			}
			else {
				possibleClassNameMatches.push(dep.dbData.name)

			}
		}.bind(this))

		className = this.standardizeClassName(className, possibleClassNameMatches);


		//name was already set to something different, make another db entry for this class
		if (pageData.parsingData.name && className != pageData.parsingData.name) {

			utils.log("['Warning name change base:', '" + pageData.parsingData.name + "','" + className + ",']" + JSON.stringify(possibleClassNameMatches));


			var dbAltEntry = null;

			//search for an existing dep with the matching classname, etc
			for (var i = 0; i < pageData.deps.length; i++) {

				//we are only looking for classes here
				if (pageData.deps[i].parser != this) {
					continue;
				}

				if (pageData.deps[i].dbData.name == className && pageData.deps[i].dbData.updatedByParent) {
					dbAltEntry = pageData.deps[i];
				}
			}

			//if there exist no entry in the pageData.deps with that matches (same name + updated by parent)
			//create a new class
			if (!dbAltEntry) {
				// utils.log('creating a new dep entry',pageData.deps.length);

				if (pageData.dbData.desc === undefined) {
					elog('wtf desc is undefined??')
				};

				dbAltEntry = pageData.addDep({
					url: pageData.dbData.url,
					updatedByParent: true,
					name: className,
				});

				//could not create a dep with this data.. uh oh
				if (!dbAltEntry) {
					return;
				}

				dbAltEntry.parsingData.crns = []

				//copy over attributes from this class
				for (var attrName in pageData.dbData) {

					//dont copy over some attributes
					if (['name', 'updatedByParent', 'url', '_id', 'crns', 'deps'].includes(attrName)) {
						continue;
					}

					dbAltEntry.setData(attrName, pageData.dbData[attrName])
				}

				dbAltEntry.setParser(this);

			}


			if (!dbAltEntry.dbData.name) {
				elog('Dont have name for dep??', dbAltEntry.dbData)
			}


			classToAddSectionTo = dbAltEntry;

		}
		else {
			pageData.parsingData.name = className;
			pageData.setData('name', className);
		}

		sectionStartingData.crn = sectionURLParsed.crn;
		if (!classToAddSectionTo.parsingData.crns) {
			elog('ERROR class parsing data has no crns attr??!?!??', classToAddSectionTo)
			return;
		};
		classToAddSectionTo.parsingData.crns.push(sectionURLParsed.crn);

	}.bind(this), element.children);








	if (!sectionStartingData.url) {
		utils.log('warning, no url found', pageData.dbData.url);
		return;
	}



	//find the next row
	var classDetails = element.next;
	while (classDetails.type != 'tag') {
		classDetails = classDetails.next;
	}

	//find the table in this section
	var tables = domutils.getElementsByTagName('table', classDetails);
	if (tables.length !== 1) {
		utils.log('warning, ' + tables.length + ' meetings tables found', pageData.dbData.url);
	}

	if (tables.length > 0) {
		sectionStartingData.meetings = [];

		var tableData = this.parseTable(tables[0]);

		if (tableData._rowCount < 1 || !tableData.daterange || !tableData.where || !tableData.instructors || !tableData.time || !tableData.days) {
			utils.log('ERROR, invalid table in class parser', tableData, pageData.dbData.url);
			return;
		}

		for (var i = 0; i < tableData._rowCount; i++) {

			sectionStartingData.meetings.push({});
			var index = sectionStartingData.meetings.length - 1;



			//if is a single day class (exams, and some classes that happen like 2x a month specify specific dates)
			var splitTimeString = tableData.daterange[i].split('-');
			if (splitTimeString.length > 1) {

				var startDate = moment(splitTimeString[0].trim(), 'MMM D,YYYY');
				var endDate = moment(splitTimeString[1].trim(), 'MMM D,YYYY');

				if (!startDate.isValid() || !endDate.isValid()) {
					utils.log('ERROR: one of parsed dates is not valid', splitTimeString, pageData.dbData.url);
				}

				//add the dates if they are valid
				//store as days since epoch 1970
				if (startDate.isValid()) {
					sectionStartingData.meetings[index].startDate = startDate.diff(0, 'day');
				}

				if (endDate.isValid()) {
					sectionStartingData.meetings[index].endDate = endDate.diff(0, 'day');
				}
			}
			else {
				utils.log("ERROR, invalid split time string or blank or something", splitTimeString, tableData.daterange[i]);
			}

			//parse the professors
			var profs = tableData.instructors[i].split(',');

			profs.forEach(function (prof) {

				//replace double spaces with a single space,trim, and remove the (p) at the end
				prof = prof.replace(/\s+/g, ' ').trim().replace(/\(P\)$/gi, '').trim();

				if (prof.length < 3) {
					utils.log('warning: empty/short prof name??', prof, tableData);
				}
				if (prof.toLowerCase() == 'tba') {
					prof = "TBA";
				}
				else {
					prof = this.toTitleCase(prof, pageData.dbData.url);
				}

				if (!sectionStartingData.meetings[index].profs) {
					sectionStartingData.meetings[index].profs = [];
				}
				sectionStartingData.meetings[index].profs.push(prof);

			}.bind(this));

			//parse the location
			sectionStartingData.meetings[index].where = this.toTitleCase(tableData.where[i], pageData.dbData.url);

			// and the type of meeting (eg, final exam, lecture, etc)
			sectionStartingData.meetings[index].type = this.toTitleCase(tableData.type[i], pageData.dbData.url);

			//start time and end time of class each day
			var times = this.parseTimeStamps(tableData.time[i], tableData.days[i]);

			//parse and add the times
			if (times) {
				sectionStartingData.meetings[index].times = times;
			}
		}
	}


	//if section dependency already exists, just add the data
	for (var i = 0; i < classToAddSectionTo.deps.length; i++) {
		var currDep = classToAddSectionTo.deps[i];
		if (!currDep.dbData.url) {
			utils.error(currDep.dbData)
			utils.log(currDep);
			continue;
		}

		if (new URI(currDep.dbData.url).equals(new URI(sectionStartingData.url))) {
			if (currDep.dbData.crn != sectionStartingData.crn) {
				utils.log("Warning urls matched but crns did not?", currDep, sectionStartingData)
			}


			for (var attrName in sectionStartingData) {
				currDep.setData(attrName, sectionStartingData[attrName])
			}
			return;
		}
	};

	//else create one
	var sectionPageData = classToAddSectionTo.addDep(sectionStartingData);
	sectionPageData.setParser(ellucianSectionParser);
};


EllucianClassParser.prototype.onBeginParsing = function (pageData) {
	pageData.parsingData.crns = []

	//create a parsingData.crns for any classes that are also deps
	pageData.deps.forEach(function (dep) {
		if (dep.parser == this) {
			dep.parsingData.crns = []
		}
	}.bind(this))
};




//parsing the htmls
EllucianClassParser.prototype.parseElement = function (pageData, element) {
	if (element.type != 'tag') {
		return;
	}
	if (!element.parent) {
		return;
	}

	if (element.name == 'a' && element.attribs.href && element.parent.attribs.class == 'ddtitle' && element.parent.attribs.scope == 'colgroup') {
		this.parseClassData(pageData, element.parent.parent);

	}
};

EllucianClassParser.prototype.onEndParsing = function (pageData) {

	// Sort the crns so that they will be equal if they are scraped two times in a row they will be the same. 
	pageData.parsingData.crns.sort();
	
	pageData.setData('crns', pageData.parsingData.crns);

	//also set the crns of the classes that were created
	var depsToRemove = [];
	pageData.deps.forEach(function (dep) {
		if (dep.parser == this) {

			// Any sub classes that don't have any sections on this pass must of had sections before, and they were removed
			// so safe to remove them 
			if (!dep.parsingData.crns || dep.parsingData.crns.length === 0) {
				utils.log('error wtf, no crns', dep)
				depsToRemove.push(dep)
			}
			else {
				dep.setData('crns', dep.parsingData.crns)
			}
		}
	}.bind(this))

	depsToRemove.forEach(function (depToRemove) {
		_.pull(pageData.deps, depToRemove);
	}.bind(this))
};












EllucianClassParser.prototype.EllucianClassParser = EllucianClassParser;

module.exports = new EllucianClassParser();



if (require.main === module) {
	module.exports.tests();
}
