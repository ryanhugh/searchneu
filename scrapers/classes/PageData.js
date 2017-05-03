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
var asyncjs = require('async');
var URI = require('urijs');
var _ = require('lodash');
var queue = require('d3-queue').queue;
import utils from '../utils';

	// pageDataMgr needs to be here, but cannot be required due to circular dependencies...

//this is called in 3 places
//server.js 
//baseParser.js (for deps)
//datamgr.js (for auto updates)
function PageData(startingData) {
	if (!startingData.dbData) {
		elog('ERROR pageData needs a dbData')
		return null;
	}
	if (!startingData.dbData.url && !startingData.dbData._id && !startingData.dbData.updatedByParent) {
		elog('page data needs  a url or an _id or an updater id!', startingData);
		return null;
	}

	//dbData is added after db search returns
	this.originalData = {};

	this.parser = null;

	//some tem variables used while parsing, not relevant when done
	this.parsingData = {};



	//stuff stored in the db
	this.dbData = {};

	this.database = null;

	this.dbLoadingStatus = this.DBLOAD_NONE;


	//dependencies [instances of pagedata]
	//note that this.dbData.deps is {parser.name:[_id,_id],...}
	this.deps = [];



	//add the starting data


	this.parent = startingData.parent;

	for (var attrName in startingData.dbData) {
		this.setData(attrName, startingData.dbData[attrName]);
	}
}


// when loading from db, 3 steps
// load data from db
// find parser
// ^ these steps for all deps (recursively)

// when loading from page,
// 1 set parser
// 2. load data (need to get name data from db so in eclass another entry is not made)
// 3. continue parsing


//db loading states
PageData.prototype.DBLOAD_NONE = 0;
PageData.prototype.DBLOAD_RUNNING = 1;
PageData.prototype.DBLOAD_DONE = 2;


PageData.create = function (startingData) {

	var pageData = new PageData(startingData);
	if (!pageData.dbData) {
		elog('ERROR could not create a pagedata!');
		return null;
	}
	return pageData;

};


PageData.createFromURL = function (url, callback) {
	return this.create({
		dbData: {
			url: url
		}
	});
};


// parser name is optional, used when loading from db
PageData.prototype.findSupportingParser = function (parserName) {
	if (this.parser) {
		elog('error, told to find a parser but already have one???', this)
		return true;
	}
	if (!this.dbData.url && !parserName) {
		elog('error cant find parser without url and name');
		return false;
	}

	var parsers = pageDataMgr.getParsers();

	for (var i = 0; i < parsers.length; i++) {
		if ((this.dbData.url && parsers[i].supportsPage(this.dbData.url)) || (parserName && parserName == parsers[i].name)) {
			return this.setParser(parsers[i]);
		}
	}
	elog('error no parser found for', this.dbData.url, parserName, this);
	return false;
};


//returns true if successful, else false
PageData.prototype.setParser = function (parser) {
	if (!parser || !parser.name) {
		elog('error tried to set to invalid parser', parser);
		return false;
	}
	if (this.parser) {
		elog('error, tried to set parser, already have a parser', this.parser.constructor.name, parser.constructor.name);
		return false;
	}


	this.parser = parser;
	utils.verbose('Using parser:', this.parser.constructor.name, 'for url', this.dbData.url, ' and name', parser.name);

	this.database = null;

	return true;
}


PageData.prototype.loadFromDB = function (callback) {
	if (!this.database) {
		console.log('cant lookup, dont have a db', this);
		return callback('cant lookup');
	}

	if (this.dbLoadingStatus != this.DBLOAD_NONE) {
		console.log('told to load, but already loaded???')
		return callback();
	}

	var lookupValues = {}

	if (this.dbData._id) {
		lookupValues._id = this.dbData._id;
	}
	else if (this.dbData.url) {
		lookupValues.updatedByParent = false;
		lookupValues.url = this.dbData.url;
	}
	else {
		elog('error in base db - cant lookup page data wihout url or _id!', this)
		return callback('cant lookup');
	}

	this.dbLoadingStatus = this.DBLOAD_RUNNING;

	this.database.find(lookupValues, {
		shouldBeOnlyOne: true,
		sanatize: false
	}, function (err, doc) {
		if (err) {
			return callback(err);
		}
		this.dbLoadingStatus = this.DBLOAD_DONE;

		//original data.dbData and .dbData cant point to the same obj
		this.originalData.dbData = _.cloneDeep(doc);

		if (!doc && lookupValues._id) {
			elog('error, looked up by id and didnt find anything???', this, lookupValues, this.database, this.parent)
		};

		var q = queue();

		if (doc) {

			if (this.dbData.deps) {
				elog('error, loaded from db and there is already data in the pagedata??', this);
			}


			this.dbData = doc;


			//load all deps too
			//iterate over each type of dep
			for (var parserName in this.dbData.deps) {
				this.dbData.deps[parserName].forEach(function (newDepId) {

					var newDepPageData = this.addDep({
						_id: newDepId
					});

					if (!newDepPageData) {
						elog('error!!!!!!, failed to load dep from db');
						return;
					}


					newDepPageData.findSupportingParser(parserName);

					q.defer(function (callback) {
						newDepPageData.loadFromDB(callback);
					}.bind(this));
				}.bind(this));
			}
		}

		q.awaitAll(function (error, results) {


			//log when the main pageData (the top of the tree) is done loading
			if (!this.parent) {
				if (this.parser) {
					utils.verbose('info pageData with no parent done loading!', this.parser.name);
				}
				else {
					utils.verbose('info pageData with no parent done loading!')
				}
			};
			return callback(null);
		}.bind(this));

	}.bind(this));
};




PageData.prototype.processDeps = function (callback) {

	if (!this.deps) {
		return callback();
	}

	this.dbData.deps = {};

	//any dep data will be inserted into main PageData for dep
	asyncjs.map(this.deps, function (depPageData, callback) {
		pageDataMgr.processPageData(depPageData, function (err, newDepData) {
			if (err) {
				elog('ERROR: processing deps:', err);
				return callback(err);
			}
			if (newDepData != depPageData) {
				elog('error pagedata was called on is diff than returned??');
				return callback('internal error');
			}

			if (!newDepData.parser || !newDepData.parser.name) {

				elog('error, cannot add dep, dont know where to add it', newDepData.parser, newDepData);
				if (newDepData.parser) {
					elog('error more data on the cannot add dep', newDepData.parser.constructor.name, newDepData.parser.name);
				}
			}


			//create the array if it dosent exist
			if (!this.dbData.deps[newDepData.parser.name]) {
				this.dbData.deps[newDepData.parser.name] = [];
			}

			//add it to the array if it dosent already exist
			//if this pagedata was loaded from cache, it will already exist
			if (this.dbData.deps[newDepData.parser.name].indexOf(newDepData.dbData._id) < 0) {
				this.dbData.deps[newDepData.parser.name].push(newDepData.dbData._id);
			}


			return callback(null, newDepData);
		}.bind(this));


	}.bind(this), function (err, results) { //
		if (err) {
			elog('error found while processing dep of', this.dbData.url, err);
			return callback(err);
		}
		else {
			this.deps = results;
			return callback();
		}
	}.bind(this));
};


PageData.prototype.getUrlStart = function () {
	var urlParsed = new URI(this.dbData.url);
	return urlParsed.scheme() + '://' + urlParsed.host();
};

//can add by url or _id - one of two is required

PageData.prototype.addDep = function (depData) {
	if (!depData) {
		elog('Error:Tried to add invalid depdata??', depData);
		return null;
	}

	//copy over values from this pageData
	//this way, parsers dont have to explicitly state these values each time they add a dep
	var valuesToCopy = ['host', 'termId', 'subject', 'classId', 'crn'];
	valuesToCopy.forEach(function (attrName) {
		if (!this.dbData[attrName]) {
			return;
		}

		//don't override given value
		else if (depData[attrName] && !_.isEqual(this.dbData[attrName], depData[attrName])) {
			console.log('given ', attrName, ' for dep is != than the value in here?', this.dbData[attrName], depData[attrName]);
			return;
		}

		depData[attrName] = this.dbData[attrName]

	}.bind(this));


	//check to make sure the dep dosent already exist in deps
	for (var i = 0; i < this.deps.length; i++) {

		var isMatch = false;

		//if given an _id to search for, make sure it matches the id in the existing depsToProcess
		if (depData._id) {
			if (this.deps[i].dbData._id == depData._id) {

				elog('error matched by _id!')

				isMatch = true;
			}
		}
		else if (depData.url) {
			if (_.isEqual(this.deps[i].dbData, depData)) {
				elog('error matched by _is equal')
				isMatch = true;
			}
		}

		if (isMatch) {
			console.log('URL was already in deps, adding new attrs!', this.deps[i], depData)
			for (var newAttrName in depData) {
				console.log('adding ', newAttrName, depData[newAttrName])
				this.deps[i].setData(newAttrName, depData[newAttrName]);
			}

			//insert the new data into the dep here, instead of adding a new dep below
			return this.deps[i];
		}
	}


	var startingData = {
		ip: this.originalData.ip,
		email: this.originalData.email,
		dbData: depData,
		parent: this,
	}


	//create the dep, add it to the array and return it
	var dep = this.constructor.create(startingData);
	if (!dep) {
		console.log('could not create dep in add dep!')
		return;
	}

	this.deps.push(dep);
	return dep;
}


PageData.prototype.setParentData = function (name, value) {
	if (!this.parent) {
		elog('error told to add to parent but dont have parent', name, JSON.stringify(value, null, 2));
		return;
	}

	this.parent.setData(name, value);
};



//used in html parser and updateDeps, here
PageData.prototype.setData = function (name, value) {
	if (name === undefined || value === undefined) {
		console.trace('ERROR:name or value was undefined!', name, value);
		return;
	}


	if (['deps'].includes(name)) {
		elog('ERROR: html set tried to override', name);
		return;
	}

	if (['_id'].includes(name) && this.dbData[name] !== undefined) {
		elog('ERROR: cant override', name, ' from value ', this.dbData[name], 'to value ', value)
		return;
	}



	// if there was an old value, and new value is different, log warning
	if (this.dbData[name] !== undefined) {

		if (name == 'url' && new URI(this.dbData.url).equals(new URI(value))) {
			return;
		}

		if (!_.isEqual(this.dbData[name], value)) {

			var propsToIgnore = {
				'lastUpdateTime': true,
				'prereqs': true,
				'coreqs': true
			}

			//only log change in last update time if in verbose mode
			if (!propsToIgnore[name]) {
				console.log('warning, overriding pageData.dbData.' + name + ' from:', JSON.stringify(this.dbData[name]), 'to:', JSON.stringify(value))
			}
		}
	}


	this.dbData[name] = value;
};


PageData.prototype.getData = function (name) {
	return this.dbData[name];
};


if (require.main === module) {
	// require('./pageDataMgr')

	// console.log(new PageData('https://google.google.com:9000/jfdsajfk').getUrlStart())
	// console.log(new PageData('https://genisys.regent.edu/pls/prod/bwckctlg.p_display_courses?term_in=201610&one_subj=COM&sel_crse_strt=507&sel_crse_end=507&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr='))


	// var a = new PageData("https://prd-wlssb.temple.edu/prod8/bwckschd.p_disp_detail_sched?term_in=201536&crn_in=23361");

	// var a = new PageData("https://prd-wlssb.temple.edu/prod8/bwckctlg.p_disp_listcrse?term_in=201536&subj_in=ACCT&crse_in=2101&schd_in=BAS");
	// a.processUrl(function () {
	// 	process.exit()
	// });



}



module.exports = PageData;
