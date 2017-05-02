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
var queue = require('d3-queue').queue

var Keys = require('../../../common/Keys')
// var classesDB = require('../databases/classesDB')
// var sectionsDB = require('../databases/sectionsDB')
// var termsDB = require('../databases/termsDB')
var path = require('path')
var fs = require('fs')

function BaseProcessor() {

}

BaseProcessor.prototype.preUpdateParse = function (query, callback) {
	return callback()
};

BaseProcessor.prototype.getClasses = function (queries, callback) {
	var classes = [];

	var q = queue();

	queries.forEach(function (query) {
		q.defer(function (callback) {
			classesDB.find(query, {
				skipValidation: true,
				shouldBeOnlyOne: false,
				sanitize: true,
				removeControllers: true
			}, function (err, results) {
				if (err) {
					return callback(err)
				}
				classes = classes.concat(results)
				return callback()
			}.bind(this))
		}.bind(this))
	}.bind(this))

	q.awaitAll(function (err) {
		callback(err, classes)
	}.bind(this))
};


BaseProcessor.prototype.getSections = function (queries, callback) {
	var sections = [];

	var q = queue();

	queries.forEach(function (query) {
		q.defer(function (callback) {
			sectionsDB.find(query, {
				skipValidation: true,
				shouldBeOnlyOne: false,
				sanitize: true,
				removeControllers: true
			}, function (err, results) {
				if (err) {
					return callback(err)
				}
				sections = sections.concat(results)
				return callback()
			}.bind(this))
		}.bind(this))
	}.bind(this))

	q.awaitAll(function (err) {
		callback(err, sections)
	}.bind(this))
};


BaseProcessor.prototype.getClassesAndSections = function (queries, callback) {
	var classes = []
	var sections = []

	var q = queue();

	q.defer(function (callback) {
		this.getSections(queries, function (err, results) {
			if (err) {
				return callback(err)
			}
			sections = results
			callback()
		}.bind(this))
	}.bind(this))

	q.defer(function (callback) {
		this.getClasses(queries, function (err, results) {
			if (err) {
				return callback(err)
			}

			classes = results
			callback()
		}.bind(this))
	}.bind(this))

	q.awaitAll(function (err) {
		if (err) {
			return callback(err)
		}
		return callback(null, classes, sections)
	}.bind(this))
};


BaseProcessor.prototype.groupSectionsByClass = function(sections) {
	var classHash = {};

	sections.forEach(function (section) {

		var obj = {
			host:section.host,
			termId: section.termId,
			subject: section.subject,
			classUid: section.classUid
		}

		var hash = Keys.create(obj).getHash();

		if (!classHash[hash]) {
			classHash[hash] = []
		}

		classHash[hash].push(section)

	}.bind(this))


	var retVal = [];

	for (var hash in classHash){
		retVal.push(classHash[hash])
	}

	return retVal;
};


// Get the minimum part of queries that overlap. eg,
// if given query {host:'neu.edu',termId:'201710'} and {host:'neu.edu',termId:'201630'}, the result would be {host:'neu.edu'}
BaseProcessor.prototype.getCommonHostAndTerm = function (queries) {
	if (queries.length === 0) {
		elog()
		return {}
	}
	var retVal = {}

	// Nothing after termId is supported yet. 
	var keys = ['host', 'termId']

	var currValue;
	for (var i = 0; i < keys.length; i++) {
		var keyName = keys[i];

		currValue = queries[0][keyName]
		for (var j = 0; j < queries.length; j++) {
			if (queries[j][keyName] != currValue) {
				return retVal;
			}
		}

		retVal[keyName] = currValue;
	}
	return retVal;
};

BaseProcessor.prototype.isUpdatingEntireTerm = function (queries) {
	// Don't run if only updating one class
	var shouldRun = false;
	for (var i = 0; i < queries.length; i++) {
		var query = queries[i];

		if (typeof query != 'object') {
			elog(queries)
		}

		if (!query.subject) {
			shouldRun = true;
			break;
		}
	}

	return shouldRun;
};


// If config.useClassId, will return {
// 	'neu.edu201602STAT002':[aClass,aClass]
// }
// if !config.useClassId, will return {
// 	'neu.edu201602STAT002_6876877897': aClass
// }
BaseProcessor.prototype.getClassHash = function (termDump, config = {}) {
	// var config;
	// if (typeof configOrCallback === 'function') {
	// 	callback = configOrCallback
	// 	config = {}
	// }
	// else {
	// 	config = configOrCallback
	// }

	// if (!callback) {
	// 	elog('dont have callback?')
	// }


	// and find all classes that could be matched
	// var queryOverlap = this.getCommonHostAndTerm(queries);
	// var matchingQuery = {
	// 	host: queryOverlap.host
	// }

	// // if base query specified term, we can specify it here too and still find all the classes needed
	// if (queryOverlap.termId) {
	// 	matchingQuery.termId = queryOverlap.termId
	// }


	//make obj to find results here quickly
	var keyToRows = {};

	// classesDB.find(matchingQuery, {
	// 	skipValidation: true
	// }, function (err, results) {
	// 	if (err) {
	// 		console.log(err);
	// 		return callback(err)
	// 	}

	termDump.classes.forEach(function (aClass) {
		if (!aClass.host || !aClass.termId || !aClass.subject || !aClass.classUid) {
			elog("ERROR class dosent have required fields??", aClass);
			return;
		}

		// multiple classes could have same key
		var key = aClass.host + aClass.termId + aClass.subject;
		if (config.useClassId) {
			key += aClass.classId

			if (!keyToRows[key]) {
				keyToRows[key] = []
			}

			// only need to keep subject and classUid
			keyToRows[key].push(aClass)
		}
		else if (aClass.classUid) {
			key += aClass.classUid

			if (keyToRows[key]) {
				elog('duplicate classUid???', keyToRows[key], aClass)
			}

			keyToRows[key] = aClass
		}
		else {
			elog('Cant use classUid if dont have classUid!', aClass)
		}


	}.bind(this));
	
	return keyToRows;
		// return callback(null, keyToRows);
	// }.bind(this))
}



// This will ensure that all data that the local dumps of the data in the database is at most a week old
BaseProcessor.prototype.ensureDataUpdated = function (callback) {
	if (!this.dumpEndpoints) {
		elog('error no dumpEndpoints in ensureDataUpdated', this)
		return callback();
	}
	
	termsDB.find({}, {
		skipValidation: true,
		shouldBeOnlyOne: false,
		sanitize: true,
		removeControllers: true
	}, function (err, results) {
		if (err) {
			return callback(err);
		}
		
		var q = queue()
		var toUpdate = [];

		results.forEach(function (result) {

			this.dumpEndpoints.forEach(function (endpoint) {

				var keys = Keys.create({
					host: result.host,
					termId: result.termId
				});

				var fileName = path.join('.', 'dist', keys.getHashWithEndpoint(endpoint));

				q.defer(function (callback) {
					
					fs.stat(fileName, function (err, stat) {
						if (err) {
							if (err.code == 'ENOENT') {
								console.log(fileName, 'does not exist, downloading')
								toUpdate.push({
									host: result.host,
									termId: result.termId
								})
								return callback()
							}
							else {
								elog('there was an error!', err)
								return callback(err);
							}
						}

						var millisecondsPerWeek = 6.048e+8;

						if (stat.mtime.getTime() + millisecondsPerWeek < new Date().getTime()) {
							console.log(fileName, 'is outdated, getting latest version', stat.mtime.toUTCString())
							toUpdate.push({
								host: result.host,
								termId: result.termId
							})
						}
						return callback()
					}.bind(this))
				}.bind(this));
			}.bind(this));
		}.bind(this));

		q.awaitAll(function (err) {
			this.go(toUpdate, function (err) {

				return callback(err)

			}.bind(this))
		}.bind(this))
	}.bind(this))
};


BaseProcessor.prototype.BaseProcessor = BaseProcessor;
module.exports = new BaseProcessor()
