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
var _ = require('lodash')
var he = require('he')
var moment = require('moment')

var Section = require('./Section')
var RequisiteBranch = require('./RequisiteBranch')




function Class(config) {


	//true, if for instance "AP placement exam, etc"
	this.isString = false;

	// A class that is listed as a prereq for another class on the site, but this class dosen't actually exist
	// Currently, missing prereqs are not even added as prereqs for classes because I can't think of any reason to list classes
	// that don't exist anywhere on the site. Could be changed in future, the fitlter is in this file. 
	// this.missing = false;

	//instances of Section()
	this.sections = []

	//loading status of the sections
	this.sectionsLoadingStatus = macros.DATASTATUS_NOTSTARTED;

	this.prereqs = {
		type: 'or',
		values: []
	}


	this.coreqs = {
		type: 'or',
		values: []
	}

	this.crns = [];
}




Class.requiredPath = ['host', 'termId', 'subject']
Class.optionalPath = ['classUid']
Class.API_ENDPOINT = '/listClasses'


// TODO: make this not ghetto, put it somewhere all the datas can access
window.termDumps = {
	classMap: {},
	subjectMap: {},
	sectionMap: {}
}


//TODO here
//abstrat away some of the checks that are the same accross fns here


Class.isValidCreatingData = function (config) {
	if (config.isString) {
		return true;
	}

	// Can make a class with clasid, not recommended and not geruentted to only have 1 or 0 results

	if (config.host && config.termId && config.subject && config.classId && !config.classUid) {
		console.warn('created class with classId')
		return true;
	}

	return BaseData.isValidCreatingData.apply(this, arguments);
};

Class.create = function (config) {
	if (config.isString) {
		var instance = new this(config);
		instance.updateWithData(config);
		return instance
	}
	return BaseData.create.call(this, config)
}


Class.load = function (termDump) {
	if (!termDump.classMap || !termDump.sectionMap) {
		console.error('invalid termDump')
		return;
	}
	console.time('hi')
	Object.assign(window.termDumps.classMap, termDump.classMap)
	Object.assign(window.termDumps.sectionMap, termDump.sectionMap)
	Object.assign(window.termDumps.subjectMap, termDump.subjectMap)
	console.timeEnd('hi')
}



Class.prototype.convertServerRequisites = function (data) {
	var retVal = {};

	//already processed node, just process the prereqs and coreqs
	if (data instanceof BaseData) {
		retVal = data;

		var newCoreqs = [];
		data.coreqs.values.forEach(function (subTree) {
			newCoreqs.push(this.convertServerRequisites(subTree))
		}.bind(this))

		data.coreqs.values = newCoreqs



		var newPrereqs = [];
		data.prereqs.values.forEach(function (subTree) {
			newPrereqs.push(this.convertServerRequisites(subTree))
		}.bind(this))

		data.prereqs.values = newPrereqs;
	}
	//given a branch in the prereqs
	else if (data.values && data.type) {

		var newValues = [];
		data.values.forEach(function (subTree) {
			newValues.push(this.convertServerRequisites(subTree))
		}.bind(this))


		retVal = new RequisiteBranch({
			type: data.type,
			values: newValues
		});
	}

	//need to create a new Class()
	else {

		//basic string
		if ((typeof data) == 'string') {
			data = {
				isString: true,
				desc: data,

			}
		}
		// else data is a normal class that has a .subject and a .classUid


		//the leafs of the prereq trees returned from the server dosent have host or termId,
		//but it is the same as the class that returned it,
		//so copy over the values
		if (!data.host) {
			data.host = this.host
		}
		if (!data.termId) {
			data.termId = this.termId
		}


		retVal = this.constructor.create(data, false)

	}

	if (!retVal) {
		elog("ERROR creating jawn", retVal, data, retVal == data)
		return
	}

	return retVal;
}

Class.prototype.download = function (callback) {
	if (!callback) {
		callback = function () {}
	}

	if (this.isString) {
		var errorMsg = "class.download called on string"
		elog(errorMsg, this)
		return callback(errorMsg)
	}
	
	if (this.prereqs.length > 0 || this.desc || this.lastUpdateTime !== undefined || this.isString) {
		this.dataStatus = macros.DATASTATUS_DONE
		return callback(null, this)
	}

	if (this.dataStatus === macros.DATASTATUS_FAIL) {
		return callback(null, this)
	}


	BaseData.prototype.download.call(this, function (err, body) {
		if (err) {
			elog('http error...', err);
			return callback(err)
		}
		callback(null, this)
	}.bind(this))
}


Class.prototype.removeMissingClasses = function (data) {
	if (data.values) {
		var retVal = [];
		var subClassesHash = {}
		data.values.forEach(function (subData) {
			if (subData.missing) {
				return;
			}

			// Check to see if it duplicates any classes already found in this data.values
			if (subData.subject && subData.classUid) {
				var key = subData.subject + subData.classUid;
				if (subClassesHash[key]) {
					return;
				}
				subClassesHash[key] = true;
			}	


			subData = this.removeMissingClasses(subData);

			if (subData.values && subData.type) {
				// If all the prereqs are missing and were all removed, don't add
				if (subData.values.length > 0) {
					retVal.push(subData)
				}
			}
			else {
				retVal.push(subData)
			}
		}.bind(this))

		return {
			type: data.type,
			values: retVal
		};
	}
	return data;
};

Class.prototype.flattenCoreqs = function() {
	
	var stack = this.coreqs.values.slice(0);
	var curr;
	var classes = []

	while ((curr = stack.pop())) {
		if (curr instanceof Class) {
			classes.push(curr)
		}
		else {
			// If it is a requisite branch, the classes needed are under prereqs...
			stack = stack.concat(curr.prereqs.values.slice(0))
		}
	}

	this.coreqs.values = classes;
};


// called once
Class.prototype.updateWithData = function (config) {
	if (config instanceof Class) {
		elog('wtf', config)
	}

	if (config.title || config.allParents || config.missing || config.updateWithData) {
		elog();
	}

	//copy over all other attr given
	for (var attrName in config) {

		//dont copy over some attr
		//these are copied below and processed a bit
		if (_(['coreqs', 'prereqs', 'download']).includes(attrName) || config[attrName] === undefined) {
			continue;
		}

		else {
			this[attrName] = config[attrName]
		}
	}

	// Remove any prereqs or coreqs that are missing
	if (config.prereqs) {
		config.prereqs = this.removeMissingClasses(config.prereqs)
	}
	if (config.coreqs) {
		config.coreqs = this.removeMissingClasses(config.coreqs)
	}

	if (config.prereqs) {
		if (!config.prereqs.values || !config.prereqs.type) {
			elog('prereqs need values ad type')
		}
		else {
			this.prereqs.type = config.prereqs.type
			this.prereqs.values = []

			//add the prereqs to this node, and convert server data
			config.prereqs.values.forEach(function (subTree) {
				this.prereqs.values.push(this.convertServerRequisites(_.cloneDeep(subTree)))
			}.bind(this))

			this.prereqs.values.sort(function (a, b) {
				return a.compareTo(b)
			}.bind(this))
		}
	}

	if (config.coreqs) {
		if (!config.coreqs.values || !config.coreqs.type) {
			elog('coreqs need values ad type')
		}
		else {
			this.coreqs.type = config.coreqs.type
			this.coreqs.values = []

			//add the coreqs to this node, and convert server data
			config.coreqs.values.forEach(function (subTree) {
				this.coreqs.values.push(this.convertServerRequisites(_.cloneDeep(subTree)))
			}.bind(this))

			this.flattenCoreqs()

			this.coreqs.values.sort(function (a, b) {
				return a.compareTo(b)
			}.bind(this))
		}
	}



	//name and description could have HTML entities in them, like &#x2260;, which we need to convert to actuall text
	//setting the innerHTML instead of innerText will work too, but this is better
	if (config.desc) {
		this.desc = he.decode(config.desc)
	}
	if (config.name) {
		this.name = he.decode(config.name)
	}


	if (!config.prettyUrl && config.url) {
		this.prettyUrl = config.url;
	};
};



Class.prototype.equals = function (other) {
	// both strings
	if (this.isString && other.isString) {
		return this.desc === other.desc;
	}

	// both classes
	if (!this.isString && !other.isString) {
		return BaseData.prototype.equals.call(this, other)
	}

	// one is a string other is a class
	return false;
};




//this is used for panels i think and for class list (settings)
//sort by classId, if it exists, and then subject
Class.prototype.compareTo = function (otherClass) {
	if (this.isString && otherClass.isString) {
		return 0;
	}

	if (this.isString) {
		return -1;
	}
	if (otherClass.isString) {
		return 1;
	};

	var aId = parseInt(this.classId);
	var bId = parseInt(otherClass.classId);

	if (aId > bId) {
		return 1;
	}
	else if (aId < bId) {
		return -1;
	}

	//if ids are the same, sort by subject
	else if (this.subject > otherClass.subject) {
		return 1;
	}
	else if (this.subject < otherClass.subject) {
		return -1;
	}

	else if (this.name > otherClass.name) {
		return 1;
	}
	else if (this.name < otherClass.name) {
		return -1;
	}
	else if (this.classUid > otherClass.classUid) {
		return 1;
	}
	else if (this.classUid < otherClass.classUid) {
		return -1;
	}
	return 0
};



Class.prototype.getHeighestProfCount = function () {
	var count = 0;


	this.sections.forEach(function (section) {
		if (section.profs) {
			count = Math.max(section.profs.length, count)
		};
	}.bind(this))
	return count;
};

Class.prototype.getPrettyClassId = function () {
	if (!this.classId) {
		return null;
	}

	var prettyClassId = this.classId;
	while (_(prettyClassId).startsWith('0') && prettyClassId.length > 1) {
		prettyClassId = prettyClassId.slice(1)
	}
	return prettyClassId

};

Class.prototype.getLastUpdateString = function () {
	if (this.lastUpdateTime) {
		return moment(this.lastUpdateTime).fromNow()
	}
	else {
		return null;
	}
};

//returns true if any sections have an exam, else false
Class.prototype.sectionsHaveExam = function () {
	for (var i = 0; i < this.sections.length; i++) {
		if (this.sections[i].getHasExam()) {
			return true;
		}
	}
	return false;
};

Class.prototype.getPrereqsString = function () {
	var retVal = [];
	this.prereqs.values.forEach(function (childBranch) {
		if (!(childBranch instanceof RequisiteBranch)) {
			if (childBranch.isString) {
				retVal.push(childBranch.desc)
			}
			else if (childBranch.dataStatus !== macros.DATASTATUS_DONE) {
				elog(childBranch)
				retVal.push('some ' + childBranch.subject + ' class')
			}
			else {
				retVal.push(childBranch.subject + ' ' + childBranch.classId)
			}
		}
		//Ghetto fix until this tree is simplified
		else if (_.uniq(childBranch.prereqs.values).length === 1) {
			retVal.push(childBranch.getPrereqsString())
		}
		else {
			retVal.push('(' + childBranch.getPrereqsString() + ')')
		}
	}.bind(this))

	// Dedupe retVal
	// If two classes have the same classId (eg. CS 2500 and CS 2500 (hon))
	// remove one of them
	retVal = _.uniq(retVal);

	if (retVal.length === 0) {
		return 'None'
	}
	else {
		retVal = retVal.join(' ' + this.prereqs.type + ' ')

		return retVal;
	}
};



Class.prototype.getCoreqsString = function () {
	var retVal = [];
	this.coreqs.values.forEach(function (childBranch) {
		if (!(childBranch instanceof RequisiteBranch)) {
			if (childBranch.isString) {
				retVal.push(childBranch.desc)
			}
			else if (childBranch.dataStatus !== macros.DATASTATUS_DONE) {
				elog(childBranch)
				retVal.push('some ' + childBranch.subject + ' class')
			}
			else {
				retVal.push(childBranch.subject + ' ' + childBranch.classId)
			}
		}
		else {
			elog('need to have classes as coreqs, not RequisiteBranch')
			retVal.push('something')
		}
	}.bind(this))

	// Dedupe retVal
	// If two classes have the same classId (eg. CS 2500 and CS 2500 (hon))
	// remove one of them
	retVal = _.uniq(retVal);

	if (retVal.length === 0) {
		return 'None'
	}
	else {
		retVal = retVal.join(' ' + this.coreqs.type + ' ')

		return retVal;
	}
};


Class.prototype.loadSections = function (sectionMap) {
	if (this.isString) {
		elog('ERROR cant load sections of !class or string')
		return callback('!class or string')
	};

	//need to load this class first, then can load sections
	//if already loaded this class, callback is called immediately
	this.download(function (err) {
		if (err) {
			elog("error download a class" + err)
			return callback(err)
		}

		this.sectionsLoadingStatus = macros.DATASTATUS_LOADING;

		var q = queue();

		this.sections.forEach(function (section) {

			q.defer(function (callback) {
				section.download(function (err, instance) {
					callback(err, instance, section)
				}.bind(this))
			}.bind(this))

		}.bind(this))

		q.awaitAll(function (err) {
			if (err) {
				elog('error loading a class section' + err)
				return callback(err);
			}


			this.sectionsLoadingStatus = macros.DATASTATUS_DONE;

			var hasWaitList = 0;
			this.sections.forEach(function (section) {
				hasWaitList += section.hasWaitList;
			}.bind(this))

			if (hasWaitList > this.sections.length / 2) {
				this.hasWaitList = true;
			}
			else {
				this.hasWaitList = false;
			}


			//sort sections
			this.sections.sort(function (a, b) {
				return a.compareTo(b);
			}.bind(this))


			callback(err)
		}.bind(this))
	}.bind(this))
};


// Downloads the first layer of prereqs
Class.prototype.downloadPrereqs = async function (classMap) {

	var promises = [];

	this.prereqs.values.forEach(function (childBranch) {
		if (childBranch instanceof RequisiteBranch) {
			promises.push(childBranch.downloadPrereqs(classMap))
		}
		else if (!childBranch.isString) {
			promises.push(childBranch.download(classMap))
		}
	}.bind(this))

	return Promise.all(promises);
};




module.exports = Class;
