import React from 'react';
import PropTypes from 'prop-types';
import CSSModules from 'react-css-modules';

import css from './BaseClassPanel.css';
import Keys from '../../../common/Keys';
import macros from '../macros';


class BaseClassPanel extends React.Component {

  constructor(props) {
    super(props);

    this.state = this.getInitialRenderedSectionState();

    this.formatReqClasses = this.formatReqClasses.bind(this);
    this.onShowMoreClick = this.onShowMoreClick.bind(this);
  }
  
  // Takes in a class and returns a react <a> element that will search for the class when clicked. Used in the prereq and coreq strings. 
  formatReqClasses(aClass) {
    const event = new CustomEvent(macros.searchEvent, { detail: aClass });
    return <a key={Keys.create(aClass).getHash()} onClick={() => {window.dispatchEvent(event)}} className={css.reqClassLink}>{aClass.subject + ' ' + aClass.classId}</a>
  }

  getInitialRenderedSectionState() {
    let sectionsShownByDefault;
    if (this.constructor.sectionsShownByDefault) {
      sectionsShownByDefault = this.constructor.sectionsShownByDefault
    }
    else {
      sectionsShownByDefault = macros.sectionsShownByDefault;
    }

    // Show 3 sections by default
    return {
      renderedSections: this.props.aClass.sections.slice(0, sectionsShownByDefault),
      unrenderedSections: this.props.aClass.sections.slice(sectionsShownByDefault),
    };
  }

  onShowMoreClick() {
    macros.log('Adding more sections to the bottom.');

    const newElements = this.state.unrenderedSections.splice(0, macros.sectionsAddedWhenShowMoreClicked);

    this.setState({
      unrenderedSections: this.state.unrenderedSections,
      renderedSections: this.state.renderedSections.concat(newElements),
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.state.renderedSections.length !== nextState.renderedSections.length) {
      return true;
    }

    return false;
  }

  // Render the Show More.. Button
  // This is the same on both desktop and mobile.
  getShowMoreButton() {
  	if (this.state.unrenderedSections.length > 0) {

      return (
        <div className={ css.showMoreButton } onClick={ this.onShowMoreClick }>
          Show More...
        </div>
      );
    }
    else {
    	return null;
    }
  }

  getCreditsString() {
    // Figure out the credits string
    if (this.props.aClass.maxCredits === this.props.aClass.minCredits) {
      return `${this.props.aClass.minCredits} credits`;
    } else {
      return `${this.props.aClass.minCredits} to ${this.props.aClass.maxCredits} credits`;
    }
  }
  
  
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



BaseClassPanel.propTypes = {
  aClass: PropTypes.object.isRequired,
};

export default BaseClassPanel;
