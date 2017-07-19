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

import macros from '../../../macros';
var Keys = require('../../../../common/Keys')
var path = require('path')
var fs = require('fs')

function BaseProcessor() {

}


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

	return Object.values(classHash);
};



// If config.useClassId, will return {
// 	'neu.edu201602STAT002':[aClass,aClass]
// }
// if !config.useClassId, will return {
// 	'neu.edu201602STAT002_6876877897': aClass
// }
BaseProcessor.prototype.getClassHash = function (termDump, config = {}) {

	// Make obj to find results here quickly.
	var keyToRows = {};

	termDump.classes.forEach(function (aClass) {
		if (!aClass.host || !aClass.termId || !aClass.subject || !aClass.classUid) {
			macros.error("ERROR class dosent have required fields??", aClass);
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
				macros.error('duplicate classUid?', keyToRows[key], aClass)
			}

			keyToRows[key] = aClass
		}
		else {
			macros.error('Cant use classUid if dont have classUid!', aClass)
		}


	}.bind(this));

	return keyToRows;
}



BaseProcessor.prototype.BaseProcessor = BaseProcessor;
module.exports = new BaseProcessor()
