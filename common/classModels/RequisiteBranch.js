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



// This class holds a branch in the prerequisite or corequisite graph. For instance, if 
// a clas's prereqs are ((a or b) and (c or d)), then 



function RequisiteBranch(data) {

	if (data.type !== 'and' && data.type !== 'or') {
		elog('invalid branch type')
	}

	if (!data.values || !Array.isArray(data.values)) {
		elog('invalid values for req branch')
	}

	var values = data.values.slice(0).sort(function (a, b) {
		return a.compareTo(b);
	}.bind(this))


	this.prereqs = {
		type: data.type,
		values: values
	}


	this.coreqs = {
		type: 'or',
		values: []
	}
}


RequisiteBranch.prototype.compareTo = function (other) {
	if (!(other instanceof RequisiteBranch)) {
		return -1;
	}
	else if (other.prereqs.values.length < this.prereqs.values.length) {
		return -1;
	}
	else if (other.prereqs.values.length > this.prereqs.values.length) {
		return 1;
	}
	else if (other.prereqs.values.length === 0 && this.prereqs.values.length === 0) {
		return 0
	}

	for (var i = 0; i < this.prereqs.values.length; i++) {
		var retVal = other.prereqs.values[i].compareTo(this.prereqs.values[i]);
		if (retVal !== 0) {
			return retVal
		}
	}


	elog('compareTo in RequisiteBranch needs more code', this, other)
};

// The argument wrapper func is optional
// If it exists, it is called on when formatting the classes 
// It is called with a class
// and can return either a string or a react element. 
RequisiteBranch.prototype.getPrereqsString = function (wrapperFunc) {
	var retVal = [];

	// Keep track of which subject+classId combonations have been used so far.
	// If you encounter the same subject+classId combo in the same loop, skip the second one.
	// This is because there is no need to show (eg. CS 2500 and CS 2500 (hon)) in the same group
	// because only the subject and the classId are going to be shown. 
	let processedSubjectClassIds = {}

	this.prereqs.values.forEach(function (childBranch) {
		if (!(childBranch instanceof RequisiteBranch)) {
			if (childBranch.isString) {

				// Skip if already seen
				if (processedSubjectClassIds[childBranch.desc]) {
					return;
				}
				processedSubjectClassIds[childBranch.desc] = true;


				retVal.push(childBranch.desc)
			}
			else {

				// Skip if already seen
				if (processedSubjectClassIds[childBranch.subject + childBranch.classId]) {
					return;
				}
				processedSubjectClassIds[childBranch.subject + childBranch.classId] = true;


				if (wrapperFunc) {
					retVal.push(wrapperFunc(childBranch))
				}
				else {
					retVal.push(childBranch.subject + ' ' + childBranch.classId)
				}
			}
		}
		//Ghetto fix until this tree is simplified
		else if (_.uniq(childBranch.prereqs.values).length === 1) {
			retVal.push(childBranch.getPrereqsString(wrapperFunc))
		}
		else {
			retVal.push(['(', childBranch.getPrereqsString(wrapperFunc), ')'])
		}
	}.bind(this))


	// Now insert the type divider ("and" vs "or") between the elements.
	// Can't use the join in case the objects are react elements
	for (var i = retVal.length - 1; i >= 1; i--) {
		retVal.splice(i, 0, ' ' + this.prereqs.type + ' ');
	}

	if (retVal.length === 0) {
		return 'None'
	}
	else {
		// retVal = retVal.join(' ' + this.prereqs.type + ' ')

		return retVal;
	}
};




// Downloads the first layer of prereqs
RequisiteBranch.prototype.loadPrereqs = async function (classMap) {
	this.prereqs.values.forEach(function (childBranch) {
		if (childBranch instanceof RequisiteBranch) {
			childBranch.loadPrereqs(classMap)
		}
		else if (!childBranch.isString) {
			childBranch.loadFromClassMap(classMap)
		}
	}.bind(this))
};





RequisiteBranch.prototype.RequisiteBranch = RequisiteBranch;
module.exports = RequisiteBranch;
