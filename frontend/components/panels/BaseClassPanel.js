/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import PropTypes from 'prop-types';

import Keys from '../../../common/Keys';
import RequisiteBranch from '../classModels/RequisiteBranch';
import macros from '../macros';
import user from '../user';

class BaseClassPanel extends React.Component {
  static propTypes = {
    aClass: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

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

    this.state = {
      prereqsPage: 0,
      coreqsPage: 0,
      prereqsForPage: 0,
      optPrereqsForPage: 0,
      renderedSections: this.props.aClass.sections.slice(0, sectionsShownByDefault),
      unrenderedSections: this.props.aClass.sections.slice(sectionsShownByDefault),

      // Whether the user has already signed up for notifications on this class.
      userIsWatchingClass: user.isWatchingClass(Keys.getClassHash(this.props.aClass)),
    };

    this.onShowMoreClick = this.onShowMoreClick.bind(this);
    this.onUserUpdate = this.onUserUpdate.bind(this);
  }

  componentDidMount() {
    // Register a handler to get updates if user changes.
    user.registerUserChangeHandler(this.onUserUpdate);
  }

  componentWillUnmount() {
    user.unregisterUserChangeHandler(this.onUserUpdate);
  }

  // If user changes and those user changes mean that we should
  // change this.state.userIsWatchingClass, make that change.
  // Internal only.
  onUserUpdate() {
    // Show the notification toggles if the user is watching this class.
    const userIsWatchingClass = user.isWatchingClass(Keys.getClassHash(this.props.aClass));
    if (userIsWatchingClass !== this.state.userIsWatchingClass) {
      this.setState({
        userIsWatchingClass: userIsWatchingClass,
      });
    }
  }

  onShowMoreClick() {
    this.setState((state) => {
      // Get the length of the our sections
      const rendered = state.renderedSections;
      const unrendered = state.unrenderedSections;

      const showAmount = (rendered.length > macros.sectionsShowAllThreshold)
        ? unrendered.length : macros.sectionsAddedWhenShowMoreClicked;

      return {
        renderedSections: rendered.concat(unrendered.slice(0, showAmount)),
        unrenderedSections: unrendered.slice(showAmount, unrendered.length),
      };
    });
  }

  // Prevents page reload and fires off new search without reloading.
  onReqClick(reqType, childBranch, event, hash) {
    this.props.history.push(hash);

    // Create the React element and add it to retVal
    const searchEvent = new CustomEvent(macros.searchEvent, { detail: `${childBranch.subject} ${childBranch.classId}` });
    window.dispatchEvent(searchEvent);
    event.preventDefault();

    // Rest of this function is analytics
    const classCode = `${childBranch.subject} ${childBranch.classId}`;
    let reqTypeString;

    switch (reqType) {
      case macros.prereqTypes.PREREQ:
        reqTypeString = 'Prerequisite';
        break;
      case macros.prereqTypes.COREQ:
        reqTypeString = 'Corequisite';
        break;
      case macros.prereqTypes.PREREQ_FOR:
        reqTypeString = 'Required Prerequisite For';
        break;
      case macros.prereqTypes.OPT_PREREQ_FOR:
        reqTypeString = 'Optional Prerequisite For';
        break;
      default:
        macros.error('unknown type.', reqType);
    }

    macros.logAmplitudeEvent('Requisite Click', {
      type: reqTypeString,
      subject: childBranch.subject,
      classId: childBranch.classId,
      classCode: classCode,
    });
  }

  // Render the Show More.. Button
  // This is the same on both desktop and mobile.
  getMoreSectionsButton() {
    if (this.state.unrenderedSections.length <= 0) {
      return null;
    }

    return (
      <div
        className='more-sections-button'
        role='button'
        tabIndex={ 0 }
        onClick={ this.onShowMoreClick }
      >
        Show More...
      </div>
    );
  }

  getCreditsString() {
    // Figure out the credits string
    let retStr = '';
    if (this.props.aClass.maxCredits !== this.props.aClass.minCredits) {
      retStr = `${this.props.aClass.minCredits} to `;
    }
    return `${retStr}${this.props.aClass.maxCredits} credits`;
  }

  // returns course Attributes
  // -> List
  getClassAttributesString() {
    return this.props.aClass.classAttributes;
  }

  // returns optional fees if they exist
  getOptionalFees() {
    if (this.props.aClass.feeDescription && this.props.aClass.feeAmount) {
      return `${this.props.aClass.feeDescription}: $${this.props.aClass.feeAmount}`;
    }
    return null;
  }

  // returns an array made to be rendered by react to display the prereqs
  getReqsString(reqType, aClass = this.props.aClass) {
    const retVal = [];

    // Keep track of which subject+classId combonations have been used so far.
    // If you encounter the same subject+classId combo in the same loop, skip the second one.
    // This is because there is no need to show (eg. CS 2500 and CS 2500 (hon)) in the same group
    // because only the subject and the classId are going to be shown.
    const processedSubjectClassIds = {};

    let childNodes;

    if (reqType === macros.prereqTypes.PREREQ) {
      childNodes = aClass.prereqs;
    } else if (reqType === macros.prereqTypes.COREQ) {
      childNodes = aClass.coreqs;
    } else if (reqType === macros.prereqTypes.PREREQ_FOR) {
      childNodes = aClass.prereqsFor;
    } else if (reqType === macros.prereqTypes.OPT_PREREQ_FOR) {
      childNodes = aClass.optPrereqsFor;
    } else {
      macros.error('Invalid prereqType', reqType);
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

          // When adding support for right click-> open in new tab, we might also be able to fix the jsx-a11y/anchor-is-valid errors.
          // They are disabled for now.
          const hash = `/${this.props.aClass.termId}/${childBranch.subject}${childBranch.classId}`;

          const element = (
            <a
              role='link'
              tabIndex='0'
              onClick={ (event) => { this.onReqClick(reqType, childBranch, event, hash); } }
              className='reqClassLink'
            >
              {`${childBranch.subject} ${childBranch.classId}`}
            </a>
          );

          retVal.push(element);
        }
      } else if (reqType === macros.prereqTypes.PREREQ) {
        // Figure out how many unique classIds there are in the prereqs.
        const allClassIds = {};
        for (const node of childBranch.prereqs.values) {
          allClassIds[node.classId] = true;
        }

        // If there is only 1 prereq with a unique classId, don't show the parens.
        if (Object.keys(allClassIds).length === 1) {
          retVal.push(this.getReqsString(macros.prereqTypes.PREREQ, childBranch));
        } else {
          retVal.push(['(', this.getReqsString(macros.prereqTypes.PREREQ, childBranch), ')']);
        }
      } else {
        macros.error('Branch found and parsing coreqs?', childBranch);
      }
    });


    // Now insert the type divider ("and" vs "or") between the elements.
    // If we're parsing prereqsFor, we should use just a comma as a separator.
    // Can't use the join in case the objects are react elements
    if (reqType === macros.prereqTypes.PREREQ_FOR || reqType === macros.prereqTypes.OPT_PREREQ_FOR) {
      for (let i = retVal.length - 1; i >= 1; i--) {
        retVal.splice(i, 0, ', ');
      }
    } else {
      let type;
      if (reqType === macros.prereqTypes.PREREQ) {
        type = aClass.prereqs.type;
      } else if (reqType === macros.prereqTypes.COREQ) {
        type = aClass.coreqs.type;
      }
      for (let i = retVal.length - 1; i >= 1; i--) {
        retVal.splice(i, 0, ` ${type} `);
      }
    }

    if (retVal.length === 0) {
      return (
        <span className='hint-text'>
          None
        </span>
      );
    }

    return retVal;
  }

  /**
   * Returns the 'page' of the specified prerequisite.
   *
   * @param {prereqTypes} prereqType type of prerequisite.
   */
  getStateValue(prereqType) {
    switch (prereqType) {
      case macros.prereqTypes.PREREQ:
        return this.state.prereqsPage;
      case macros.prereqTypes.COREQ:
        return this.state.coreqsPage;
      case macros.prereqTypes.PREREQ_FOR:
        return this.state.prereqsForPage;
      case macros.prereqTypes.OPT_PREREQ_FOR:
        return this.state.optPrereqsForPage;
      default:
        return -1;
    }
  }

  /**
   * Returns how many elements we should return from our array of prerequisites.
   * Note that we mutliply our value by two because every other value is ', '
   * We could probably make this better...
   *
   * @param {prereqTypes} prereqType type of prerequisite.
   */
  getShowAmount(prereqType) {
    const classesShownByDefault = 5;
    const stateValue = this.getStateValue(prereqType);
    return 2 * classesShownByDefault * (stateValue + 1);
  }

  /**
   * Returns the array that we should be displaying
   *
   * @param {prereqTypes} prereqType type of prerequisite.
   */
  optionalDisplay(prereqType) {
    let data = this.getReqsString(prereqType, this.props.aClass);

    if (Array.isArray(data)) {
      if (this.getStateValue(prereqType) >= 3) {
        return data;
      }

      const showAmt = this.getShowAmount(prereqType);

      // Slice down the array of elements to show to the number of elements we should show.
      data = data.slice(0, showAmt);

      // If it ends in a comma, remove the comma from the end.
      if (typeof data[data.length - 1] === 'string' && data[data.length - 1].trim() === ',') {
        data = data.slice(0, data.length - 1);
      }
    }

    return data;
  }

  /**
   * Returns the 'Show More' button of the prereqType, if one is needed.
   * @param {prereqTypes} prereqType type of prerequisite.
   */
  showMore(prereqType) {
    const data = this.getReqsString(prereqType, this.props.aClass);

    if (!Array.isArray(data)
      || this.getStateValue(prereqType) >= 3
      || this.getShowAmount(prereqType) >= data.length) {
      return null;
    }

    return (
      <div
        className='prereq-show-more hint-text'
        tabIndex={ 0 }
        role='button'
        onClick={ () => {
          this.setState((prevState) => {
            switch (prereqType) {
              case macros.prereqTypes.PREREQ:
                return { prereqsPage: prevState.prereqsPage + 1 };
              case macros.prereqTypes.COREQ:
                return { coreqsPage: prevState.coreqsPage + 1 };
              case macros.prereqTypes.PREREQ_FOR:
                return { prereqsForPage: prevState.prereqsForPage + 1 };
              case macros.prereqTypes.OPT_PREREQ_FOR:
                return { optPrereqsForPage: prevState.optPrereqsForPage + 1 };
              default:
                return macros.error(`invalid prereq type!: ${prereqType}`);
            }
          });
        } }
      >
        Show More
      </div>
    );
  }

  // Just used for testing. Not used anywhere in the frontend.
  render() {
    return (
      <div>
        <div>
          {this.state.renderedSections.map((section) => {
            return section.getHash();
          })}
        </div>
        <div>
          {this.state.unrenderedSections.map((section) => {
            return section.getHash();
          })}
        </div>
      </div>
    );
  }
}

export default BaseClassPanel;
