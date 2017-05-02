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
var BaseProcessor = require('./baseProcessor').BaseProcessor

// Add classUids to classes. ClassUid = ClassId + '_'  + hash(class.name)
// Lookup by classUid and there will be either 0 or 1 results
// Lookup by classId and there will be 0+ results.

function AddClassUids() {
	BaseProcessor.prototype.constructor.apply(this, arguments);
}

AddClassUids.prototype = Object.create(BaseProcessor.prototype);
AddClassUids.prototype.constructor = AddClassUids;

// http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
AddClassUids.prototype.getStringHash = function (input) {
	var hash = 0;
	var i;
	var chr;
	var len;

	if (input.length === 0) {
		elog("getStringHash given input.length ==0!!");
		return hash;
	}
	for (i = 0, len = input.length; i < len; i++) {
		chr = input.charCodeAt(i);
		hash = ((hash << 5) - hash) + chr;
		hash |= 0; // Convert to 32bit integer
	}
	return String(Math.abs(hash));
};


AddClassUids.prototype.getClassUid = function (classId, title) {
	if (!title) {
		elog('get class id given not title!')
	}
	return classId + '_' + this.getStringHash(title);
};



// base query is the key shared by all classes that need to be updated
// if an entire college needs to be updated, it could be just {host:'neu.edu'}
// at minimum it will be a host
// or if just one class {host, termId, subject, classId}
AddClassUids.prototype.go = function (termDump) {

	let crnMap = {}

	for (let aClass of termDump.classes) {
		aClass.classUid = this.getClassUid(aClass.classId, aClass.name);
		if (aClass.crns) {
			for (let crn of aClass.crns) {
				crnMap[crn] = aClass
			}
		}
	}


	for (let section of termDump.sections) {
		if (!crnMap[section.crn]) {
			console.error('ERROR no crn found!', crn)
			continue;
		}

		section.classUid = this.getClassUid(crnMap[section.crn].classId, crnMap[section.crn].name);
	}
	console.log(termDump, 'here')

	return termDump
};


module.exports = new AddClassUids();


