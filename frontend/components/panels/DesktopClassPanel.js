/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import PropTypes from 'prop-types';
import CSSModules from 'react-css-modules';
import classNames from 'classnames/bind';

import globe from './globe.svg';
import desktopCss from './DesktopClassPanel.css';
import baseCss from './BaseClassPanel.css';
import macros from '../macros';
import BaseClassPanel from './BaseClassPanel';
import DesktopSectionPanel from './DesktopSectionPanel';


// Merge the base css and the css specific to desktop panels
// The identityObjProxy check is so the class names appear in the snap files in testing
// Lets move to sass instead of css eventually.
const css = {};
Object.assign(css, baseCss, desktopCss);

const cx = classNames.bind(css);


// Class Panel that renders the box with the class title, class description, and class sections
// If mobile, uses MobileSectionPanel to show the sections.
// The code for desktop is inside this file.


// DesktopClassPanel page component
class DesktopClassPanel extends BaseClassPanel {
  static propTypes = {
    aClass: PropTypes.object.isRequired,
  };

  componentDidUpdate() {
    macros.debounceTooltipRebuild();
  }

  componentDidMount() {
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
    // const foundSectionWithLessThanTenSeats = false;

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
      // const showOnlineColumn = aClass.getHasOnlineSections();

      const showWaitList = this.shouldShowWaitlist();

      sectionTable = (
        <table className={ `ui celled striped table ${css.resultsTable}` }>
          <thead>
            <tr>
              <th>
                <div className={ css.inlineBlock } data-tip='Course Reference Number'>
                    CRN
                </div>
              </th>
              <th> Professors </th>
              <th> Weekdays </th>
              <th> Time </th>

              <th> Location </th>
              {examColumnHeaders}
              <th> Seats </th>

              <th
                className={ cx({
                  displayNone: !showWaitList,
                }) }
              > Waitlist seats
              </th>
              <th> Link </th>
            </tr>
          </thead>
          <tbody>
            {/* The CSS applied to the table stripes every other row, starting with the second one.
              This tr is hidden so the first visible row is a dark stripe instead of the second one. */}
            <tr className={ css.sectionTableFirstRow } />
            {this.state.renderedSections.map((section) => {
              return <DesktopSectionPanel key={ section.crn } showWaitList={ showWaitList } shouldShowExamColumns={ aClass.sectionsHaveExam() } section={ section } />;
            })}
          </tbody>
        </table>
      );
    }

    // Render the Show More.. Button
    const showMoreSections = this.getShowMoreButton();

    // Figure out the credits string
    const creditsString = this.getCreditsString();

    return (
      <div>
        <div className={ `${css.container} ui segment` }>
          <div className={ css.header }>
            <span className={ css.classTitle }>
              {aClass.subject} {aClass.classId}: {aClass.name}
            </span>
            <span className={ css.classGlobeLinkContainer }>
              <a target='_blank' rel='noopener noreferrer' className={ css.classGlobeLink } data-tip={ `View on ${aClass.host}` } href={ aClass.prettyUrl || aClass.url }>
                <img src={ globe } alt='link' />
              </a>
            </span>
          </div>

          <div className={ css.body }>
            {aClass.desc}
            <br />
            <br />
            <div className={ css.leftPanel }>
              Prerequisites: {this.optionalDisplay(macros.prereqTypes.PREREQ)} {this.showMore(macros.prereqTypes.PREREQ)}
              <br />
              Corequisites: {this.optionalDisplay(macros.prereqTypes.COREQ)} {this.showMore(macros.prereqTypes.COREQ)}
              <br />
              Prerequisite for: {this.optionalDisplay(macros.prereqTypes.PREREQ_FOR)} {this.showMore(macros.prereqTypes.PREREQ_FOR)}
              <br />
              Optional Prerequisite for: {this.optionalDisplay(macros.prereqTypes.OPT_PREREQ_FOR)} {this.showMore(macros.prereqTypes.OPT_PREREQ_FOR)}
            </div>
            <div className={ css.rightPanel }>
              <div data-tip='Check neu.edu for possible updates'> Updated {aClass.getLastUpdateString()}</div>
              {creditsString}
            </div>
          </div>
          {sectionTable}
          {showMoreSections}
        </div>
      </div>
    );
  }
}

// Number of sections to show by default. This is different on mobile.
DesktopClassPanel.sectionsShownByDefault = 3;

export default CSSModules(DesktopClassPanel, css);
