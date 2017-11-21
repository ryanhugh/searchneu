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

const css = {};

Object.assign(css, mobileCss, baseCss);

const cx = classNames.bind(css);


// Class Panel that renders the box with the class title, class description, and class sections
// If mobile, uses MobileSectionPanel to show the sections.
// The code for desktop is inside this file.


class MobileClassPanel extends BaseClassPanel {
  constructor(props) {
    super(props);

    this.state.showMoreThanTitle = false;
    this.state.showAllClassDetails = false;

    this.toggleShowMoreThanTitle = this.toggleShowMoreThanTitle.bind(this);
    this.toggleShowAllClassDetails = this.toggleShowAllClassDetails.bind(this);
  }

  toggleShowMoreThanTitle() {
    const newTitleValue = !this.state.showMoreThanTitle;
    let newShowAllClassDetails = this.state.showAllClassDetails;

    // If closing the class accordian, reset the showAllClassDetails back to the default.
    let newState = {};
    if (!newTitleValue) {
      newShowAllClassDetails = false;
      newState = this.getInitialRenderedSectionState();
    }

    newState.showMoreThanTitle = newTitleValue;
    newState.showAllClassDetails = newShowAllClassDetails;

    this.setState(newState);
  }

  toggleShowAllClassDetails() {
    this.setState({
      showAllClassDetails: !this.state.showAllClassDetails,
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    const commonShouldUpdate = BaseClassPanel.prototype.shouldComponentUpdate.call(this, nextProps, nextState);
    if (commonShouldUpdate) {
      return true;
    }

    if (this.state.showMoreThanTitle !== nextState.showMoreThanTitle) {
      return true;
    }

    if (this.state.showAllClassDetails !== nextState.showAllClassDetails) {
      return true;
    }

    if (this.state.optPrereqsForPage !== nextState.optPrereqsForPage) {
      return true;
    }

    if (this.state.prereqsForPage !== nextState.prereqsForPage) {
      return true;
    }

    return false;
  }

  getClassBody() {
    const aClass = this.props.aClass;

    let showFullClassBody = false;

    if (this.state.showAllClassDetails) {
      showFullClassBody = true;
    } else if (!aClass.desc || aClass.desc.length < 50) {
      showFullClassBody = true;
    }

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
            Prerequisites: {this.getReqsString('prereqs', aClass)}
            <br />
            Corequisites: {this.getReqsString('coreqs', aClass)}
            <br />
            Prerequisite for: {this.getReqsString('prereqsFor', aClass)}
            <br />
            Optional Prerequisite for: {this.optionalDisplay('optPrereqsFor')} {this.showMore('optPrereqsFor')}
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
            onClick={ this.toggleShowAllClassDetails }
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
    let chevron;
    if (this.state.showMoreThanTitle) {
      chevron = chevronDown;
    } else {
      chevron = chevronRight;
    }

    return (
      <div>
        <div className={ `${css.container} ui segment` }>
          <div
            className={ css.header }
            onClick={ this.toggleShowMoreThanTitle }
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

MobileClassPanel.propTypes = {
  aClass: PropTypes.object.isRequired,
};


export default CSSModules(MobileClassPanel, css);
