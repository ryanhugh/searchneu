/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */


import macros from '../commonMacros';

// This class holds a branch in the prerequisite or corequisite graph. For instance, if
// a clas's prereqs are ((a or b) and (c or d)), then

class RequisiteBranch {
  constructor(data) {
    if (data.type !== 'and' && data.type !== 'or') {
      macros.error('invalid branch type');
    }

    if (!data.values || !Array.isArray(data.values)) {
      macros.error('invalid values for req branch');
    }

    const values = data.values.slice(0).sort((a, b) => {
      return a.compareTo(b);
    });


    this.prereqs = {
      type: data.type,
      values: values,
    };


    this.coreqs = {
      type: 'or',
      values: [],
    };
  }


  compareTo(other) {
    if (!(other instanceof RequisiteBranch)) {
      return -1;
    } else if (other.prereqs.values.length < this.prereqs.values.length) {
      return -1;
    } else if (other.prereqs.values.length > this.prereqs.values.length) {
      return 1;
    } else if (other.prereqs.values.length === 0 && this.prereqs.values.length === 0) {
      return 0;
    }

    for (let i = 0; i < this.prereqs.values.length; i++) {
      const retVal = other.prereqs.values[i].compareTo(this.prereqs.values[i]);
      if (retVal !== 0) {
        return retVal;
      }
    }


    macros.error('compareTo in RequisiteBranch needs more code', this, other);
    return 0;
  }


  // Downloads the first layer of prereqs
  async loadPrereqs(classMap) {
    this.prereqs.values.forEach((childBranch) => {
      if (childBranch instanceof RequisiteBranch) {
        childBranch.loadPrereqs(classMap);
      } else if (!childBranch.isString) {
        childBranch.loadFromClassMap(classMap);
      }
    });
  }
}


export default RequisiteBranch;
