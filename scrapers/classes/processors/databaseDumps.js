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
var mkdirp = require('mkdirp');
var queue = require('d3-queue').queue
var fs = require('fs')
var path = require('path')

var macros = require('../macros')
var BaseProcessor = require('./baseProcessor').BaseProcessor;
var classesDB = require('../databases/classesDB')
var sectionsDB = require('../databases/sectionsDB')
var subjectsDB = require('../databases/subjectsDB')
var Keys = require('../../common/Keys')


function DatabaseDumps() {
	BaseProcessor.prototype.constructor.apply(this, arguments);
	
	this.dumpEndpoints = [macros.LIST_SUBJECTS, macros.LIST_CLASSES, macros.LIST_SECTIONS];
	
}


DatabaseDumps.prototype = Object.create(BaseProcessor.prototype);
DatabaseDumps.prototype.constructor = DatabaseDumps;



DatabaseDumps.prototype.saveRows = function (endpoint, results, callback) {

	// list of host + termId to the files that the classes go in;
	var classLists = {};

	results.forEach(function (row) {

		var key = row.host + '/' + row.termId

		if (!classLists[key]) {
			classLists[key] = {
				list: [],
				host: row.host,
				termId: row.termId
			}
		}

		classLists[key].list.push(row);

	}.bind(this));

	var q = queue();

	for (var attrName in classLists) {
		q.defer(function (callback) {
			var rowData = classLists[attrName]

			var keys = Keys.create({
				host: rowData.host,
				termId: rowData.termId
			});

			var fileName = path.join('.', 'dist', keys.getHashWithEndpoint(endpoint));
			var folderName = path.dirname(fileName);

			mkdirp(folderName, function (err) {
				if (err) {
					return callback(err);
				}

				fs.writeFile(fileName, JSON.stringify(rowData.list), function (err) {
					if (err) {
						return callback(err);
					}

					console.log("Successfully saved", endpoint, rowData.host, rowData.termId);

					return callback()
				}.bind(this));
			}.bind(this));
		}.bind(this))
	}

	q.awaitAll(function (err) {
		if (err) {
			return callback(err)
		}

		callback()
	}.bind(this))
}



DatabaseDumps.prototype.go = function (queries, callback) {
	if (!this.isUpdatingEntireTerm(queries)) {
		return callback()
	}

	// Get all the classes in a term, or all the classes in the entire host
	var query = this.getCommonHostAndTerm(queries)

	var searchQuery = {};

	if (query.host) {
		searchQuery.host = query.host

		if (query.termId) {
			searchQuery.termId = query.termId
		}
	}

	var q = queue()

	q.defer(function (callback) {
		this.getClasses([searchQuery], function (err, results) {
			if (err) {
				return callback(err)
			}
			this.saveRows(macros.LIST_CLASSES, results, function (err) {
				return callback(err)
			}.bind(this))
		}.bind(this))
	}.bind(this))

	q.defer(function (callback) {
		this.getSections([searchQuery], function (err, results) {
			if (err) {
				return callback(err)
			}
			this.saveRows(macros.LIST_SECTIONS, results, function (err) {
				return callback(err)
			}.bind(this))
		}.bind(this))
	}.bind(this))

	q.defer(function (callback) {
		subjectsDB.find(searchQuery, {
			skipValidation: true,
			shouldBeOnlyOne: false,
			sanitize: true,
			removeControllers: true
		}, function (err, results) {
			if (err) {
				return callback(err)
			}
			this.saveRows(macros.LIST_SUBJECTS, results, function (err) {
				return callback(err)
			}.bind(this))
		}.bind(this))
	}.bind(this))

	q.awaitAll(function (err) {
		callback(err)
	}.bind(this))
}



DatabaseDumps.prototype.DatabaseDumps = DatabaseDumps;
module.exports = new DatabaseDumps();


if (require.main === module) {
	module.exports.ensureDataUpdated(function (err) {
		console.log(err, 'done')
	});
	// module.exports.go([{
	// 	// host: 'swarthmore.edu',
	// 	// termId: "201710"
	// }], function (err, results) {
	// 	console.log("done,", err, results);

	// }.bind(this));


	// module.exports.go({
	// 	host: 'neu.edu',
	// 	// termId: "201710"
	// }, function (err, results) {
	// 	console.log("done,", err, results);

	// }.bind(this));
}
