/*
 * This file is part of Search NEU and licensed under AGPL3. 
 * See the license file in the root folder for details. 
 */

import _ from 'lodash';
import macros from '../commonMacros';



// This class holds a branch in the prerequisite or corequisite graph. For instance, if 
// a clas's prereqs are ((a or b) and (c or d)), then 



function RequisiteBranch(data) {

	if (data.type !== 'and' && data.type !== 'or') {
		macros.error('invalid branch type')
	}

	if (!data.values || !Array.isArray(data.values)) {
		macros.error('invalid values for req branch')
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


	macros.error('compareTo in RequisiteBranch needs more code', this, other)
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
