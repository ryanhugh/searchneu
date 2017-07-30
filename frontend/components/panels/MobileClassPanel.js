import React from 'react';
import PropTypes from 'prop-types';
import CSSModules from 'react-css-modules';
import classNames from 'classnames/bind';

import globe from './globe.svg';
import chevronDown from './chevron-down.svg';
import chevronRight from './chevron-right.svg';
import mobileCss from './MobileClassPanel.css';
import baseCss from './BaseClassPanel.css';
import MobileSectionPanel from './MobileSectionPanel';
import macros from '../macros';
import Keys from '../../../common/Keys';
import LocationLinks from './LocationLinks';
import WeekdayBoxes from './WeekdayBoxes';
import BaseClassPanel from './BaseClassPanel'

const css = {}

Object.assign(css, mobileCss, baseCss)

const cx = classNames.bind(css);


// Class Panel that renders the box with the class title, class description, and class sections
// If mobile, uses MobileSectionPanel to show the sections. 
// The code for desktop is inside this file. 


class MobileClassPanel extends BaseClassPanel {

  constructor(props) {
    super(props);

    this.state.showMoreThanTitle = false;
    this.state.showAllClassDetails = false; 

    this.toggleShoreMoreThanTitle = this.toggleShoreMoreThanTitle.bind(this);
  }

  toggleShoreMoreThanTitle() {
    this.setState({
      showMoreThanTitle: !this.state.showMoreThanTitle
    })
  }

  shouldComponentUpdate(nextProps, nextState) {
    let commonShouldUpdate = BaseClassPanel.prototype.shouldComponentUpdate.call(this, nextProps, nextState);
    if (commonShouldUpdate) {
      return true;
    }

    if (this.state.showMoreThanTitle !== nextState.showMoreThanTitle) {
      return true;
    }

    if (this.state.showAllClassDetails !== nextState.showAllClassDetails) {
      return true;
    }
    
    return false;
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
    let showMoreSections = this.getShowMoreButton();

    // Figure out the credits string
    let creditsString = this.getCreditsString();


    // Decide which chevron to use based on whether the panel is expanded or not.
    let chevron;
    if (this.state.showMoreThanTitle) {
      chevron = chevronDown
    }
    else {
      chevron = chevronRight
    }

    return (
      <div>
        <div className={ `${css.container} ui segment` }>
          <div className={ css.header } onClick={this.toggleShoreMoreThanTitle}>
            <img className = {css.chevron} src = {chevron}/>
            <span className = { css.classTitle }>
              {aClass.subject} {aClass.classId}: {aClass.name}
            </span>
          </div>

          <span className={ cx({
            displayNone: !this.state.showMoreThanTitle
          }) }>

            <div className={ css.body }>
              {aClass.desc}
              <br />
              <br />
              <div>
                Updated {aClass.getLastUpdateString()}
                <br />
                {creditsString}
                <br />
                <a target='_blank' rel='noopener noreferrer' href={aClass.prettyUrl || aClass.url}>
                  {'View on ' + aClass.host}
                </a>
                <br />
                Corequisites: {aClass.getCoreqsString()}
                <br />
                Prerequisites: {aClass.getPrereqsString()}
              </div>
            </div>

            {sectionTable} 

            {showMoreSections}
          </span>
        </div>
      </div>
    );




  }

}


MobileClassPanel.propTypes = {
  aClass: PropTypes.object.isRequired,
};


export default CSSModules(MobileClassPanel, css);
