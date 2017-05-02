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

// This file dumps all relevent classes from the DB into RAM in the pre parsing hook
// and then checks to see if they changed after updating
// and if they did, fire off notifications.

// This used to be done by having an update hook in classesDB, and whenever a row was updated check to see if it was a class that was being watched,
// and if it was and if the class changed, fire off notifications. However, the processors would download the class rows and change fields, which 
// would count as updates when the parsers would run again because it was different than what the parsers were parsing. 

// Another way to do this would be to only upload the data to the DB after parsing and processing, but then it might cause a race condition if the row in the DB
// was updated by something else between when the data was downloaded before parsing and when it was uploaded after processing. 
// If the data in the DB changed between when the rows were downloaded and uploaded any changes would be silently overwritten. 

// If this is slow, it is is probably due to the cloneDeeps in UserDB.rowUpdatedTrigger

var queue = require('d3-queue').queue
var _ = require('lodash')

var macros = require('../macros')
var BaseProcessor = require('./baseProcessor').BaseProcessor;
var classesDB = require('../databases/classesDB')
var sectionsDB = require('../databases/sectionsDB')
var usersDB = require('../databases/usersDB')
var Keys = require('../../common/Keys')


function NotifyOnChanges() {

	this.classes = [];
	this.sections = [];
}


NotifyOnChanges.prototype = Object.create(BaseProcessor.prototype);
NotifyOnChanges.prototype.constructor = NotifyOnChanges;




NotifyOnChanges.prototype.preUpdateParse = function (queries, callback) {
	if (this.classes.length !== 0 || this.sections.length !== 0) {
		elog('classes or sections not [] on start?', this.classes.length, this.classes[0], this.sections.length, this.sections[0])
	}

	this.getClassesAndSections(queries, function (err, classes, sections) {
		if (err) {
			return callback(err)
		}
		this.classes = classes;
		this.sections = sections
		callback()
	}.bind(this))

};



NotifyOnChanges.prototype.go = function (queries, callback) {

	if (this.classes.length === 0 && this.sections.length === 0) {
		console.log("NotifyOnChanges has no classes or sections stored, exiting")
		return callback()
	}

	this.getClassesAndSections(queries, function (err, classes, sections) {
		if (err) {
			return callback(err)
		}

		// Create a hash of this.classes and this.sections
		var classHash = {};
		var sectionHash = {};

		this.classes.forEach(function (row) {
			classHash[Keys.create(row, macros.LIST_CLASSES).getHash()] = row
		}.bind(this))

		this.sections.forEach(function (row) {
			sectionHash[Keys.create(row, macros.LIST_SECTIONS).getHash()] = row
		}.bind(this))

		var q = queue()

		classes.forEach(function (newClass) {

			var hash = Keys.create(newClass, macros.LIST_CLASSES).getHash();

			if (!classHash[hash]) {
				console.log("New class in NotifyOnChanges: ", hash);
				return;
			}

			q.defer(function (callback) {
				// classUpdated and sectionUpdated calculate the diff
				usersDB.classUpdated(classHash[hash], newClass, callback);
			}.bind(this))
		}.bind(this))


		sections.forEach(function (newSection) {
			var hash = Keys.create(newSection, macros.LIST_SECTIONS).getHash();

			// This could fire if classes were removed/added during parsing, but should not fire too many times each parsing
			if (!sectionHash[hash]) {
				console.log("New section in NotifyOnChanges: ", hash);
				return;
			}

			q.defer(function (callback) {
				usersDB.sectionUpdated(sectionHash[hash], newSection, callback);
			}.bind(this))
		}.bind(this))

		q.awaitAll(function (err) {

			this.classes = [];
			this.sections = []
			return callback(err)
		}.bind(this))

	}.bind(this))
};



NotifyOnChanges.prototype.NotifyOnChanges = NotifyOnChanges;
module.exports = new NotifyOnChanges();


if (require.main === module) {
	module.exports.go({
		host: 'neu.edu',
		// termId: "201710"
	}, function (err, results) {
		console.log("done,", err, results);

	}.bind(this));


	// module.exports.go({
	// 	host: 'neu.edu',
	// 	// termId: "201710"
	// }, function (err, results) {
	// 	console.log("done,", err, results);

	// }.bind(this));
}
