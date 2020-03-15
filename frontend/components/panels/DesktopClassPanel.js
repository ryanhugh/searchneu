/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import PropTypes from 'prop-types';

import Collapsible from 'react-collapsible';
import macros from '../macros';
import BaseClassPanel from './BaseClassPanel';
import DesktopSectionPanel from './DesktopSectionPanel';
import SignUpForNotifications from '../SignUpForNotifications';

import globe from './globe.svg';

// Class Panel that renders the box with the class title, class description, and class sections
// If mobile, uses MobileSectionPanel to show the sections.
// The code for desktop is inside this file.

// Note, if you do override the constructor,
// Don't do `this.state = {...}`, because the state is already setup in the parent react component
// instead just do this.state.something = 5;

export default class DesktopClassPanel extends BaseClassPanel {
  constructor(props) {
    super(props);
    this.onUserUpdate = this.onUserUpdate.bind(this);
  }

  static propTypes = {
    aClass: PropTypes.object.isRequired,
  };

  componentDidUpdate() {
    macros.debounceTooltipRebuild();
  }

  componentDidMount() {
    // componentDidMount is implemented in BaseClassPanel
    // Make sure to run that code too.
    super.componentDidMount();

    macros.debounceTooltipRebuild();
  }

  // Method to decide whether to show the waitlist or not
  // This logic is different than it is on mobile (because of formatting differences)
  // See MobileSectionPanel.js
  shouldShowWaitlist() {
    const aClass = this.props.aClass;

    // If the class does not have a waitlist, don't show the waitlist
    if (!aClass.getHasWaitList()) {
      return false;
    }

    // If all the sections have 0 seats on the waitlist and 0 total seats, don't show the waitlist (because there isn't actually a waitlist).
    let foundSectionWithWaitlistSeats = false;

    for (const section of aClass.sections) {
      if (section.waitRemaining > 0 || section.waitCapacity > 0) {
        foundSectionWithWaitlistSeats = true;
        break;
      }
    }

    if (!foundSectionWithWaitlistSeats) {
      return false;
    }

    // Also show the waitlist if any of the sections have less than 10 seats left.
    // The number 10 is just an arbitrary decision and can be changed in the future.
    for (const section of aClass.sections) {
      if (section.seatsRemaining < 10) {
        return true;
      }
    }

    // If there are plenty of seats left, don't show the waitlist
    return false;
  }

  render() {
    const aClass = this.props.aClass;
    // Render the section table if this class has sections
    let sectionTable = null;
    if (aClass.sections && aClass.sections.length > 0) {
      // Add the Exam column headers if there are any sections in this class that has exam listed
      let examColumnHeaders = null;
      if (aClass.sectionsHaveExam()) {
        examColumnHeaders = [
          <th key='1'>Exam time</th>,
          <th key='3'>Exam date</th>,
          <th key='4'>Exam location</th>,
        ];
      }

      // Add the Online sections head if there are any sections that are online
      const showWaitList = this.shouldShowWaitlist();

      const showHonorsColumn = aClass.getHasHonorsSections();

      sectionTable = (
        <table className='ui celled striped table resultsTable'>
          <thead>
            <tr>
              <th>
                <div className='inlineBlock' data-tip='Course Reference Number'>
                  CRN
                </div>
              </th>
              <th> Professors </th>
              <th> Weekdays </th>
              <th> Time </th>

              <th> Location </th>
              {examColumnHeaders}
              <th> Seats </th>

              <th style={{ display: !showWaitList && 'none' }}>
                Waitlist seats
              </th>
              <th style={{ display: !showHonorsColumn && 'none' }}>
                Honors
              </th>
              <th style={{ display: !this.state.userIsWatchingClass && 'none' }}>
                Notifs
              </th>
              <th> Link </th>
            </tr>
          </thead>
          <tbody>
            {/* The CSS applied to the table stripes every other row, starting with the second one.
              This tr is hidden so the first visible row is a dark stripe instead of the second one. */}
            <tr className='sectionTableFirstRow' />
            {this.state.renderedSections.map((section) => {
              return (
                <DesktopSectionPanel
                  key={ section.crn }
                  showWaitList={ showWaitList }
                  shouldShowExamColumns={ aClass.sectionsHaveExam() }
                  showNotificationSwitches={ this.state.userIsWatchingClass }
                  showHonorsColumn={ showHonorsColumn }
                  section={ section }
                />
              );
            })}
          </tbody>
        </table>
      );
    }

    // Render the Show More.. Button
    const showMoreSections = this.getMoreSectionsButton();

    // Figure out the credits string, and course Attributes
    const creditsString = this.getCreditsString();

    const feeString = this.getOptionalFees();

    let feeElement = null;

    if (feeString) {
      let feeAmount = feeString.split(' ');
      feeAmount = feeAmount[feeAmount.length - 1];
      feeAmount = `You must pay ${feeAmount} extra to take this class`;
      feeElement = <div className='inlineBlock' data-tip={ feeAmount }>{feeString}</div>;
    }
    const courseAttrString = this.getClassAttributesString();

    let courseAttr;
    if (courseAttrString) {
      courseAttr = courseAttrString.map((item) => {
        return <div key={ item }>{item}</div>;
      });
    }

    return (
      <div className='class-panel-container ui segment'>
        <div className='header'>
          <span className='classTitle'>
            {aClass.subject} {aClass.classId}: {aClass.name}
          </span>
          <span className='classGlobeLinkContainer'>
            <a
              target='_blank'
              rel='noopener noreferrer'
              className='classGlobeLink'
              data-tip={ `View on ${aClass.host}` }
              href={ aClass.prettyUrl || aClass.url }
            >
              <img src={ globe } alt='link' />
            </a>
          </span>
        </div>

        <div className='panel-body'>
          {aClass.desc}
          <br />
          <br />
          <div className='leftPanel'>
            Prerequisites: {this.optionalDisplay(macros.prereqTypes.PREREQ)} {this.showMore(macros.prereqTypes.PREREQ)}
            <br />
            Corequisites: {this.optionalDisplay(macros.prereqTypes.COREQ)} {this.showMore(macros.prereqTypes.COREQ)}
            <br />
            Prerequisite for: {this.optionalDisplay(macros.prereqTypes.PREREQ_FOR)} {this.showMore(macros.prereqTypes.PREREQ_FOR)}
            <br />
            Optional Prerequisite for: {this.optionalDisplay(macros.prereqTypes.OPT_PREREQ_FOR)} {this.showMore(macros.prereqTypes.OPT_PREREQ_FOR)}
            <br />
            <Collapsible trigger='Show Course Attributes'>
              <div>
                {courseAttr}
              </div>
            </Collapsible>
            <div>
              {feeElement}
            </div>
          </div>
          <div className='rightPanel'>
            <div data-tip='Check neu.edu for possible updates'> Updated {aClass.getLastUpdateString()}</div>
            {creditsString}
            <div>
              <SignUpForNotifications aClass={ aClass } userIsWatchingClass={ this.state.userIsWatchingClass } />
            </div>

          </div>
        </div>
        {sectionTable}
        {showMoreSections}
      </div>

    );
  }
}

// Number of sections to show by default. This is different on mobile.
DesktopClassPanel.sectionsShownByDefault = 3;
