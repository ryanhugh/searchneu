/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import PropTypes from 'prop-types';
import CSSModules from 'react-css-modules';
import classNames from 'classnames/bind';

import chevronDown from './chevron-down.svg';
import chevronRight from './chevron-right.svg';
import mobileCss from './MobileClassPanel.css';
import baseCss from './BaseClassPanel.css';
import MobileSectionPanel from './MobileSectionPanel';
import Keys from '../../../common/Keys';
import BaseClassPanel from './BaseClassPanel';
import macros from '../macros';
import SignUpForNotifications from '../SignUpForNotifications';

const css = {};

Object.assign(css, mobileCss, baseCss);

const cx = classNames.bind(css);


// Class Panel that renders the box with the class title, class description, and class sections
// If mobile, uses MobileSectionPanel to show the sections.
// The code for desktop is inside this file.


class MobileClassPanel extends BaseClassPanel {
  static propTypes = {
    aClass: PropTypes.object.isRequired,
  };

  getClassBody() {
    const aClass = this.props.aClass;

    const showFullClassBody = (this.state.showAllClassDetails ||
        (!aClass.desc || aClass.desc.length < 50));

    if (showFullClassBody) {
      // Figure out the credits string
      const creditsString = this.getCreditsString();

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
              this.setState({
                showAllClassDetails: !this.state.showAllClassDetails,
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
        return <MobileSectionPanel key={ Keys.create(section).getHash() } section={ section } />;
      });
    }

    // Render the Show More.. Button
    const showMoreSections = this.getShowMoreButton();

    // Decide which chevron to use based on whether the panel is expanded or not.
    const chevron = (this.state.showMoreThanTitle) ? chevronDown : chevronRight;

    return (
      <div>
        <div className={ `${css.container} ui segment` }>
          <div
            className={ css.header }
            onClick={ () => {
              this.setState({
                showMoreThanTitle: !this.state.showMoreThanTitle,
              });
            } }
            role='button'
            tabIndex={ 0 }
          >
            <img className={ css.chevron } src={ chevron } alt='' />
            <span className={ css.classTitle }>
              {aClass.subject} {aClass.classId}: {aClass.name}
            </span>
          </div>

          <span className={ cx({
            displayNone: !this.state.showMoreThanTitle,
          }) }
          >

            <div className={ css.body }>
              {this.getClassBody()}
            </div>

            {sectionTable}

            {showMoreSections}
          </span>
        </div>
      </div>
    );
  }
}

// Number of sections to show by default.
MobileClassPanel.sectionsShownByDefault = 1;

export default CSSModules(MobileClassPanel, css);
