/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import RequisiteBranch from '../../../common/classModels/RequisiteBranch';
import css from './BaseClassPanel.css';
import macros from '../macros';


class BaseClassPanel extends React.Component {
  constructor(props) {
    super(props);

    this.state = this.getInitialRenderedSectionState();

    this.onShowMoreClick = this.onShowMoreClick.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.state.renderedSections.length !== nextState.renderedSections.length) {
      return true;
    }

    return false;
  }

  onShowMoreClick() {
    macros.log('Adding more sections to the bottom.');

    let newElements;
    if (this.state.renderedSections.length > macros.sectionsShowAllThreshold) {
      newElements = this.state.unrenderedSections.splice(0, this.state.unrenderedSections.length);
    } else {
      newElements = this.state.unrenderedSections.splice(0, macros.sectionsAddedWhenShowMoreClicked);
    }


    this.setState({
      unrenderedSections: this.state.unrenderedSections,
      renderedSections: this.state.renderedSections.concat(newElements),
    });
  }

  getInitialRenderedSectionState() {
    let sectionsShownByDefault;
    if (this.constructor.sectionsShownByDefault) {
      sectionsShownByDefault = this.constructor.sectionsShownByDefault;
    } else {
      sectionsShownByDefault = macros.sectionsShownByDefault;
    }

    // If this is desktop and there is exactly one section hidden by the button, just show them all.
    if (!macros.isMobile && this.props.aClass.sections.length === sectionsShownByDefault + 1) {
      sectionsShownByDefault++;
    }

    // Show 3 sections by default
    return {
      renderedSections: this.props.aClass.sections.slice(0, sectionsShownByDefault),
      unrenderedSections: this.props.aClass.sections.slice(sectionsShownByDefault),
    };
  }

  // Render the Show More.. Button
  // This is the same on both desktop and mobile.
  getShowMoreButton() {
    if (this.state.unrenderedSections.length > 0) {
      return (
        <div className={ css.showMoreButton } role='button' tabIndex={ 0 } onClick={ this.onShowMoreClick }>
          Show More...
        </div>
      );
    }
    return null;
  }

  getCreditsString() {
    // Figure out the credits string
    if (this.props.aClass.maxCredits === this.props.aClass.minCredits) {
      return `${this.props.aClass.minCredits} credits`;
    }
    return `${this.props.aClass.minCredits} to ${this.props.aClass.maxCredits} credits`;
  }


  // The argument wrapper func is optional
  // If it exists, it is called on when formatting the classes
  // It is called with a class
  // and can return either a string or a react element.
  getReqsString(parsingPrereqs = 'prereqs', aClass = this.props.aClass) {
    const retVal = [];

    // Keep track of which subject+classId combonations have been used so far.
    // If you encounter the same subject+classId combo in the same loop, skip the second one.
    // This is because there is no need to show (eg. CS 2500 and CS 2500 (hon)) in the same group
    // because only the subject and the classId are going to be shown.
    const processedSubjectClassIds = {};

    let childNodes;

    if (parsingPrereqs === 'prereqs') {
      childNodes = aClass.prereqs;
    } else if (parsingPrereqs === 'coreqs') {
      childNodes = aClass.coreqs;
    } else if (parsingPrereqs === 'prereqsFor') {
      if (!aClass.optPrereqsFor) { return null; }
      childNodes = aClass.optPrereqsFor;
    }

    childNodes.values.forEach((childBranch) => {
      // If the childBranch is a class
      if (!(childBranch instanceof RequisiteBranch)) {
        if (childBranch.isString) {
          // Skip if already seen
          if (processedSubjectClassIds[childBranch.desc]) {
            return;
          }
          processedSubjectClassIds[childBranch.desc] = true;


          retVal.push(childBranch.desc);
        } else {
          // Skip if already seen
          if (processedSubjectClassIds[childBranch.subject + childBranch.classId]) {
            return;
          }
          processedSubjectClassIds[childBranch.subject + childBranch.classId] = true;

          // Create the React element and add it to retVal
          const event = new CustomEvent(macros.searchEvent, { detail: `${childBranch.subject} ${childBranch.classId}` });

          //   href={"/" + encodeURIComponent(childBranch.subject + ' ' + childBranch.classId)}

          // let thethiing ={
          //   host: aClass.host,
          //   termId: aClass.termId,
          //   subject: childBranch.subject,
          //   classUid: childBranch.classUid,
          // };

          // let oldthing = Keys.create(childBranch).getHash();

          // if (oldthing !== Keys.create(thethiing).getHash()) {
          //   debugger
          // }

          // When adding support for right click-> open in new tab, we might also be able to fix the jsx-a11y/anchor-is-valid errors.
          // They are disabled for now.


          const hash = `${childBranch.subject} ${childBranch.classId}`;

          const element = (
            <a
              key={ hash }
              role='link'
              tabIndex={ 0 }
              onClick={ (e) => { window.dispatchEvent(event); e.preventDefault(); return false; } }
              className={ css.reqClassLink }
            >
              {`${childBranch.subject} ${childBranch.classId}`}
            </a>);

          retVal.push(element);
        }
      } else if (parsingPrereqs === 'prereqs') {
        // If the child branch is a requisite branch
        //Ghetto fix until this tree is simplified
        if (_.uniq(childBranch.prereqs.values).length === 1) {
          retVal.push(this.getReqsString('prereqs', childBranch));
        } else {
          retVal.push(['(', this.getReqsString('prereqs', childBranch), ')']);
        }
      } else {
        macros.error('Branch found and parsing coreqs?', childBranch);
      }
    });


    // Now insert the type divider ("and" vs "or") between the elements.
    // Can't use the join in case the objects are react elements
    for (let i = retVal.length - 1; i >= 1; i--) {
      retVal.splice(i, 0, ` ${aClass.prereqs.type} `);
    }

    if (retVal.length === 0) {
      return 'None';
    }

    // retVal = retVal.join(' ' + this.prereqs.type + ' ')

    return retVal;
  }
}


BaseClassPanel.propTypes = {
  aClass: PropTypes.object.isRequired,
};

export default BaseClassPanel;
