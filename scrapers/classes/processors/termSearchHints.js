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
var _ = require('lodash')

var macros = require('../macros')
var BaseProcessor = require('./baseProcessor').BaseProcessor;
var classesDB = require('../databases/classesDB')
var sectionsDB = require('../databases/sectionsDB')
var termsDB = require('../databases/termsDB')
var Keys = require('../../common/Keys')


// Genereates the hints to put in the search box for each term
// could also change this to be most seats capacity instead of most seats taken, or highest avg seat capacity of a class
// Would probably be good to add more than 2 hints per collage, and would also be good to add profs
// 
// Also, this queries for all classes in an entire host, but then sets the hints for each term. Idealy, it would process each term individually. 


function TermSearchHints() {

}

TermSearchHints.prototype = Object.create(BaseProcessor.prototype);
TermSearchHints.prototype.constructor = TermSearchHints;

TermSearchHints.prototype.runOnHost = function (query, callback) {
	this.getClassesAndSections([query], function (err, classes, sections) {
		if (err) {
			return callback(err)
		}

		console.log("Got classes and sections for ", query.host);

		var highestClasses = [];
		var sectionHash = {}

		sections.forEach(function (section) {
			sectionHash[Keys.create(section).getHash()] = section;
		}.bind(this))

		classes.forEach(function (aClass) {
			if (!aClass.crns || aClass.crns.length === 0) {
				return;
			}

			if (aClass.name.match(/(^|\s)+Lab(\s|$)+/gi) || aClass.name.match(/(^|\s)+Thesis(\s|$)+/gi)) {
				return;
			}

			if (!aClass.name.match(/General|Fundamentals|Principals|Introduction|First\-Year/gi)) {
				return;
			}

			var score = 0;


			aClass.crns.forEach(function (crn) {

				var hash = Keys.create({
					host: aClass.host,
					termId: aClass.termId,
					subject: aClass.subject,
					classUid: aClass.classUid,
					crn: crn
				}).getHash()


				var section = sectionHash[hash];
				if (!section.meetings || section.meetings.length === 0) {
					return;
				}

				score += section.seatsCapacity - section.seatsRemaining;
			}.bind(this))

			var thisObj = {
				class: aClass,
				score: score
			}

			if (highestClasses.length < 2) {
				highestClasses.push(thisObj)
				return;
			}
			else {

				if (score > highestClasses[0].score) {
					highestClasses[0] = thisObj
				}
				else if (score > highestClasses[1].score) {
					highestClasses[1] = thisObj
				}
			}
		}.bind(this))

		var hints = [highestClasses[0].class.name, highestClasses[1].class.subject + ' ' + highestClasses[1].class.classId]

		if (query.host === 'neu.edu') {
			hints.push('Leena Razzaq')
			hints.push('Physics 1')
			hints.push('Calculus 2')
			hints.push('Banking')
			hints.push('Robotics')
			hints.push('PHYS 1151')
			hints.push('PHIL 1101')
		}

		console.log("Settings search hints to ", hints);

		termsDB.update(query, {
			$set: {
				searchHints: hints
			}
		}, {
			shouldBeOnlyOne: false
		}, function (err, results) {
			callback(err, hints)
		}.bind(this))
	}.bind(this))
};


TermSearchHints.prototype.go = function (queries, callback) {
	if (!this.isUpdatingEntireTerm(queries)) {
		return callback()
	}

	// Dedupe the hosts so only run on each host once
	var hosts = {};

	queries.forEach(function (query) {
		if (query.subject) {
			return;
		}

		hosts[query.host] = true
	}.bind(this))

	hosts = _.keys(hosts)

	console.log("Running on", hosts);

	var hints = []

	var q = queue();
	hosts.forEach(function (host) {
		q.defer(function (callback) {

			this.runOnHost({
				host: host
			}, function (err, currHints) {
				if (err) {
					return callback(err)
				}
				hints = hints.concat(currHints)
				callback()
			}.bind(this))
		}.bind(this))
	}.bind(this))

	q.awaitAll(function (err) {
		if (err) {
			return callback(err)
		}
		return callback(null, hints)
	}.bind(this))
};



TermSearchHints.prototype.TermSearchHints = TermSearchHints;
module.exports = new TermSearchHints();


if (require.main === module) {
	module.exports.go([{
		host: 'neu.edu',
	}], function (err, results) {
		console.log("done,", err, results);

	}.bind(this));


	// module.exports.go({
	// 	host: 'neu.edu',
	// 	// termId: "201710"
	// }, function (err, results) {
	// 	console.log("done,", err, results);

	// }.bind(this));
}
