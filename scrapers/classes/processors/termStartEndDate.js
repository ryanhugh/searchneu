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
var sectionsDB = require('../databases/sectionsDB')
var termsDB = require('../databases/termsDB')
var BaseProcessor = require('./baseProcessor').BaseProcessor
var _ = require('lodash')
var queue = require('d3-queue').queue


// This file adds startDate and endDate to each term based on the start and end dates in sections in that term
// The start date is the first date that over 10% of sections start on, and the end is the last date that over 10% of sections end on
// If no one date has over 10% sections start on that date, it is just the first/last date


function TermStartEndDate() {
	BaseProcessor.prototype.constructor.apply(this, arguments);
}

TermStartEndDate.prototype = Object.create(BaseProcessor.prototype);
TermStartEndDate.prototype.constructor = TermStartEndDate;


TermStartEndDate.prototype.runOnTerm = function (query, callback) {

	sectionsDB.find(query, {
		skipValidation: true
	}, function (err, docs) {
		if (err) {
			return callback(err)
		}
		var startDates = {};
		var endDates = {};
		var meetingCount = 0;

		if (docs.length === 0) {
			elog('No sections in db???', query, docs);
		}

		docs.forEach(function (doc) {

			if (doc.meetings) {
				doc.meetings.forEach(function (meeting) {
					if (startDates[meeting.startDate] == undefined) {
						startDates[meeting.startDate] = 0;
					}
					startDates[meeting.startDate]++

						if (endDates[meeting.endDate] == undefined) {
							endDates[meeting.endDate] = 0;
						}
					endDates[meeting.endDate]++
						meetingCount++
				}.bind(this))
			}
		}.bind(this))

		var finalStartDate;
		var finalEndDate;

		var startDateKeys = _.keys(startDates).sort(function (a, b) {
			return parseInt(a) - parseInt(b)
		}.bind(this))

		for (var i = 0; i < startDateKeys.length; i++) {
			var date = startDateKeys[i]
			if (startDates[date] > .1 * meetingCount) {
				finalStartDate = date;
				break;
			}
		}

		// Pick the first day if nothing was decisive.
		if (!finalStartDate) {
			console.log('Warning, no start date was definitive', query.termId, startDates)
			finalStartDate = startDateKeys[0];
		}



		// Now for the end dates
		var endDateKeys = _.keys(endDates).sort(function (a, b) {
			// sort in reverse order
			return parseInt(b) - parseInt(a)
		}.bind(this))

		for (var i = 0; i < endDateKeys.length; i++) {
			var date = endDateKeys[i]
			if (endDates[date] > .1 * meetingCount) {
				finalEndDate = date;
				break;
			}
		}

		// Pick the last day if nothing was decisive. 
		// (the endDateKeys are in reverse chronological order)
		if (!finalEndDate) {
			console.log('Warning, no end date was definitive', query.termId, endDates)
			finalEndDate = endDateKeys[0];
		}


		termsDB.update(query, {
			$set: {
				startDate: finalStartDate,
				endDate: finalEndDate
			}
		}, {
			shouldBeOnlyOne: true
		}, function (err) {
			callback(err, {
				endDate: finalEndDate,
				startDate: finalStartDate
			})
		}.bind(this))
	}.bind(this))
};



TermStartEndDate.prototype.go = function (baseQueries, callback) {

	// Don't run if only updating one class
	var shouldRun = false;
	for (var i = 0; i < baseQueries.length; i++) {
		var baseQuery = baseQueries[i];
		if (!baseQuery.subject) {
			shouldRun = true;
			break;
		}
	}

	if (!shouldRun) {
		return callback()
	}

	var query = this.getCommonHostAndTerm(baseQueries);

	if (query.host && query.termId) {
		return this.runOnTerm({
			host: query.host,
			termId: query.termId
		}, function (err, result) {
			if (err) {
				return callback(err)
			}
			return callback(null, [result])
		}.bind(this));
	}
	else {
		var q = queue()
		var results = [];

		//For each term in the host, update the 
		termsDB.find({
			host: query.host
		}, {
			skipValidation: true
		}, function (err, terms) {
			if (err) {
				return callback(err)
			}

			terms.forEach(function (term) {
				if (!term.termId) {
					return;
				}
				q.defer(function (callback) {
					this.runOnTerm({
						host: term.host,
						termId: term.termId
					}, function (err, result) {
						if (err) {
							return callback(err)
						}

						results.push(result)

						callback(err)
					}.bind(this))
				}.bind(this))
			}.bind(this))

			q.awaitAll(function (err) {
				callback(err, results)
			}.bind(this))

		}.bind(this))
	}
}


TermStartEndDate.prototype.TermStartEndDate = TermStartEndDate;

module.exports = new TermStartEndDate();

if (require.main === module) {
	module.exports.go([{
		host:'neu.edu'
	}], function (err) {
		console.log("DONE!", err);
	}.bind(this))
}
