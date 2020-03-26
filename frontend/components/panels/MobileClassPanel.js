/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import PropTypes from 'prop-types';

import Collapsible from 'react-collapsible';
import MobileSectionPanel from './MobileSectionPanel';
import BaseClassPanel from './BaseClassPanel';
import macros from '../macros';
import SignUpForNotifications from '../SignUpForNotifications';

import chevronDown from './chevron-down.svg';
import chevronRight from './chevron-right.svg';

// Class Panel that renders the box with the class title, class description, and class sections
// If mobile, uses MobileSectionPanel to show the sections.
// The code for desktop is inside this file.


class MobileClassPanel extends BaseClassPanel {
  static propTypes = {
    aClass: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    // Keep track of whether the panel should be expanded or should just the title be shown.
    // NOTE: this.state is setup (this.state = {...}) in the parent class BaseClassPanel,
    // so all we need to do here is another field.
    this.state.showMoreThanTitle = false;
  }

  getClassBody() {
    const aClass = this.props.aClass;

    const showFullClassBody = (this.state.showAllClassDetails
        || (!aClass.desc || aClass.desc.length < 50));

    if (showFullClassBody) {
      // Figure out the credits string
      const creditsString = this.getCreditsString();
      const courseAttrString = this.getClassAttributesString();
      let courseAttr;
      if (courseAttrString) {
        courseAttr = courseAttrString.map((i, k) => {
          return <div k={ k }>{i}</div>;
        });
      }
      const feeString = this.getOptionalFees();

      return (
        <span>
          {aClass.desc}
          <br />
          <br />
          <div>
            {creditsString}
            <br />
            Updated {aClass.getLastUpdateString()}
            <br />
            <a target='_blank' rel='noopener noreferrer' href={ aClass.prettyUrl || aClass.url }>
              {`View on ${aClass.host}`}
            </a>
            <br />
            Prerequisites: {this.optionalDisplay(macros.prereqTypes.PREREQ)} {this.showMore(macros.prereqTypes.PREREQ)}
            <br />
            Corequisites: {this.optionalDisplay(macros.prereqTypes.COREQ)} {this.showMore(macros.prereqTypes.COREQ)}
            <br />
            Prerequisite for: {this.optionalDisplay(macros.prereqTypes.PREREQ_FOR)} {this.showMore(macros.prereqTypes.PREREQ_FOR)}
            <br />
            Optional Prerequisite for: {this.optionalDisplay(macros.prereqTypes.OPT_PREREQ_FOR)} {this.showMore(macros.prereqTypes.OPT_PREREQ_FOR)}
            <br />
            <Collapsible trigger='Show Class Attributes'>
              <div>
                {courseAttr}
              </div>
            </Collapsible>
            {feeString}

            <SignUpForNotifications aClass={ aClass } />
          </div>
        </span>
      );
    }


    // Remove everything past 80 characters
    // and then keep on removing characters until the end of a word is hit.
    let sliceDesc = aClass.desc.slice(0, 80);
    while (!sliceDesc.endsWith(' ')) {
      sliceDesc = sliceDesc.slice(0, sliceDesc.length - 1);
    }

    // Also remove any symbols.
    while (!sliceDesc[sliceDesc.length - 1].match(/[a-z]/i)) {
      sliceDesc = sliceDesc.slice(0, sliceDesc.length - 1);
    }
    sliceDesc = sliceDesc.trim();

    return (
      <span>
        <span>
          {`${sliceDesc}...`}&nbsp;&nbsp;&nbsp;&nbsp;
        </span>
        <div>
          <a
            onClick={ () => {
              this.setState((state) => {
                return {
                  showAllClassDetails: !state.showAllClassDetails,
                };
              });
            } }
            style={{ display:'inline-block' }}
            role='button'
            tabIndex={ 0 }
          >
            Show More...
          </a>
        </div>
      </span>

    );
  }

  render() {
    const aClass = this.props.aClass;

    let sectionTable = null;

    if (aClass.sections && aClass.sections.length > 0) {
      sectionTable = this.state.renderedSections.map((section) => {
        return <MobileSectionPanel key={ section.getHash() } section={ section } showNotificationSwitches={ this.state.userIsWatchingClass } />;
      });
    }

    // Render the Show More.. Button
    const showMoreSections = this.getMoreSectionsButton();

    // Decide which chevron to use based on whether the panel is expanded or not.
    const chevron = (this.state.showMoreThanTitle) ? chevronDown : chevronRight;

    return (
      <div className='class-panel-container ui segment mobile'>
        <div
          className='header'
          onClick={ () => {
            this.setState((state) => {
              return {
                showMoreThanTitle: !state.showMoreThanTitle,
              };
            });
          } }
          role='button'
          tabIndex={ 0 }
        >
          <img className='chevron' src={ chevron } alt='' />
          <span className='classTitle'>
            {aClass.subject} {aClass.classId}: {aClass.name}
          </span>
        </div>

        <span style={{ display: !this.state.showMoreThanTitle && 'none' }}>

          <div className='panel-body'>
            {this.getClassBody()}
          </div>

          {sectionTable}

          {showMoreSections}
        </span>
      </div>
    );
  }
}

// Number of sections to show by default.
MobileClassPanel.sectionsShownByDefault = 1;

export default MobileClassPanel;
