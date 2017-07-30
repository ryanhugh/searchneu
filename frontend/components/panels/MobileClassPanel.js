import React from 'react';
import PropTypes from 'prop-types';
import CSSModules from 'react-css-modules';
import classNames from 'classnames/bind';

import globe from './globe.svg';
import chevronDown from './chevron-down.svg';
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
  }


  render() {
    const aClass = this.props.aClass;




    if (!this.state.showMoreThanTitle) {
      
    }




    // if (aClass.sections && aClass.sections.length > 0) {
    //   sectionTable = this.state.renderedSections.map((section) => {
    //         return <MobileSectionPanel key={ Keys.create(section).getHash() } section={ section } />;
    //       });
    // }

    // {sectionTable} 



    // Render the Show More.. Button
    let showMoreSections = this.getShowMoreButton();

    // Figure out the credits string
    let creditsString = this.getCreditsString();



    // Globe link (to be moved into body under updated and credits)
    // <span className = {css.classGlobeLinkContainer}> 
    //   <a target="_blank" rel="noopener noreferrer" className={ css.classGlobeLink } data-tip={ "View on " + aClass.host} href={ aClass.prettyUrl || aClass.url }>
    //     <img src={ globe } alt="link"/>
    //   </a>
    // </span>


    return (
      <div>
        <div className={ `${css.container} ui segment` }>
          <div className={ css.header }>
            <img className = {css.chevronDown} src = {chevronDown}/>
            <span className = { css.classTitle }>
              {aClass.subject} {aClass.classId}: {aClass.name}
            </span>
            
          </div>

          <div className={ css.body }>
            {aClass.desc}
            <br />
            <br />
            <div className={ css.leftPanel }>
              Prerequisites: {aClass.getPrereqsString()}
              <br />
              Corequisites: {aClass.getCoreqsString()}
            </div>
            <div className={ css.rightPanel }>
              Updated {aClass.getLastUpdateString()}
              <br />
              {creditsString}
            </div>
          </div>
          
          {showMoreSections}
        </div>
      </div>
    );




  }

}


MobileClassPanel.propTypes = {
  aClass: PropTypes.object.isRequired,
};


export default CSSModules(MobileClassPanel, css);
