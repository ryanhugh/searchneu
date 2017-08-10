

// Small abstract class between Class.js and RequisiteBranch.js

//Instances of this can either be a class or a requisite branch


class RequisiteNode {
  
    
  // The argument wrapper func is optional
  // If it exists, it is called on when formatting the classes 
  // It is called with a class
  // and can return either a string or a react element. 
  getReqsString(parsingPrereqs = true, wrapperFunc = null) {
  	var retVal = [];
  
  	// Keep track of which subject+classId combonations have been used so far.
  	// If you encounter the same subject+classId combo in the same loop, skip the second one.
  	// This is because there is no need to show (eg. CS 2500 and CS 2500 (hon)) in the same group
  	// because only the subject and the classId are going to be shown. 
  	let processedSubjectClassIds = {}
  	
  	let childNodes;
  	
  	if (parsingPrereqs) {
  	  childNodes = this.prereqs
  	}
  	else {
  	  childNodes = this.coreqs
  	}
  	
  
  	childNodes.values.forEach(function (childBranch) {
  	  
  	  // If the childBranch is a class 
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
  		
  		// If the child branch is a requisite branch
  		else if (parsingPrereqs) {
    		//Ghetto fix until this tree is simplified
    		if (_.uniq(childBranch.prereqs.values).length === 1) {
    			retVal.push(childBranch.getReqsString(parsingPrereqs, wrapperFunc))
    		}
    		else {
    			retVal.push(['(', childBranch.getReqsString(parsingPrereqs, wrapperFunc), ')'])
    		}
  		}
  		else {
  		  macros.error("Branch found and parsing coreqs?", childBranch)
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
  }
}





export default RequisiteNode;