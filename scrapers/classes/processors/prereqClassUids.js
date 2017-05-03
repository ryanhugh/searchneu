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
// var macros = require('../macros')
// var classesDB = require('../databases/classesDB')
var ellucianRequisitesParser = require('../parsers/ellucianRequisitesParser')
var BaseProcessor = require('./baseProcessor').BaseProcessor

var queue = require('d3-queue').queue

// This file converts prereq classIds to ClassUids by looking up the classes in the db and replacing classIds with classUids
// if there are multiple results, it creates a 'or' prereq tree, much like Class.js does in the frontend. 

function PrereqClassUids() {
	BaseProcessor.prototype.constructor.apply(this, arguments);
}


PrereqClassUids.prototype = Object.create(BaseProcessor.prototype);
PrereqClassUids.prototype.constructor = PrereqClassUids;


PrereqClassUids.prototype.updatePrereqs = function (prereqs, host, termId, keyToRows) {
	for (var i = prereqs.values.length - 1; i >= 0; i--) {
		var prereqEntry = prereqs.values[i]

		// prereqEntry could be Object{subject:classId:} or string i think
		if (typeof prereqEntry == 'string') {
			continue;
		}
		else if (prereqEntry.classId && prereqEntry.subject) {
			// multiple classes could have same key
			var key = host + termId + prereqEntry.subject + prereqEntry.classId

			var newPrereqs = [];

			if (keyToRows[key]) {
				keyToRows[key].forEach(function (row) {
					newPrereqs.push({
						subject: row.subject,
						classUid: row.classUid
					})
				}.bind(this))
			}



			// not in db, this is possible and causes those warnings in the frontend 
			// unable to find class even though its a prereq of another class????
			if (newPrereqs.length === 0) {
				prereqs.values[i].missing = true;
			}
			// only one match, just swap classId for classUid
			else if (newPrereqs.length == 1) {
				prereqs.values[i] = {
					subject: newPrereqs[0].subject,
					classUid: newPrereqs[0].classUid
				}
			}
			// the fun part - make the 'or' split for multiple classes
			else {
				prereqs.values[i] = {
					type: 'or',
					values: newPrereqs
				}
			}
		}
		else if (prereqEntry.type && prereqEntry.values) {
			prereqs.values[i] = this.updatePrereqs(prereqEntry, host, termId, keyToRows)
		}
		else if (prereqEntry.classUid && prereqEntry.subject) {
			// don't do anything, this is already fixed
		}
		else {
			elog('wtf is ', prereqEntry, prereqs)
		}
	}
	return prereqs;

};



// base query is the key shared by all classes that need to be updated
// if an entire college needs to be updated, it could be just {host:'neu.edu'}
// at minimum it will be a host
// or if just one class {host, termId, subject, classId}
PrereqClassUids.prototype.go = function (termDump) {


	var keyToRows = this.getClassHash(termDump, {
		useClassId: true
	})



	var updateQueue = queue()

	// loop through classes to update, and get the new data from all the classes
	for (let aClass of termDump.classes) {

		var toUpdate = {};
		if (aClass.prereqs) {
			let prereqs = this.updatePrereqs(aClass.prereqs, aClass.host, aClass.termId, keyToRows);

			// And simplify tree again
			aClass.prereqs = ellucianRequisitesParser.simplifyRequirements(prereqs)
		}

		if (aClass.coreqs) {
			let coreqs = this.updatePrereqs(aClass.coreqs, aClass.host, aClass.termId, keyToRows);
			aClass.coreqs = ellucianRequisitesParser.simplifyRequirements(coreqs)


			// Remove honors coreqs from classes that are not honors
			// This logic is currently in the frontend, but should be moved to the backend.
			// and remove non honors coreqs if there is a hon lab with the same classId
			// this isnt going to be 100% reliable across colleges, idk how to make it better, but want to error on the side of showing too many coreqs

		}
	}
	return termDump;
};


PrereqClassUids.prototype.PrereqClassUids = PrereqClassUids;
module.exports = new PrereqClassUids();



if (require.main === module) {
	module.exports.go([{
		host: 'neu.edu'
	}], function (err) {
		console.log("DONE!", err);
	})

	// module.exports.go({
	// 	host: 'swarthmore.edu'
	// }, function (err) {
	// 	console.log("DONE!", err);
	// })
	// 
}
