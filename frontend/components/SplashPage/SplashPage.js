import React from 'react';
import CSSModules from 'react-css-modules';
import classNames from 'classnames/bind';

import cs2500Mobile from "./cs2500 mobile.png"
import cs2500Resultsmobile from "./cs2500 results mobile.png"
import cs2510Desktop from "./cs2510 desktop.png"
import engw1111Desktop from "./engw1111 desktop.png"
import lernerMobile from "./lerner mobile.png"
import oodMobile1 from "./ood mobile 1.png"
import oodMobile2 from "./ood mobile 2.png"

import { Grid, Segment, Divider } from 'semantic-ui-react';
import { Button } from 'semantic-ui-react';

import css from './SplashPage.css';
import macros from '../macros';



const cx = classNames.bind(css);

class SplashPage extends React.Component {

  render () {

    // Events that fire when the buttons are clicked.
    const searchForCS2510Event = new CustomEvent(macros.searchEvent, { detail: 'CS 2510' });
    const searchForENGW1111Event = new CustomEvent(macros.searchEvent, { detail: 'ENGW 1111' });
    const searchForOODEvent = new CustomEvent(macros.searchEvent, { detail: 'OOD' });

    // <img className = {css.lernerMobile} src={lernerMobile}/>

    return  (
      <span className={css.splashPageContainer}>
        

        {/* First Row. */}
        <Grid stackable className={css.firstRow}>
          {/* These widths must add up to 16.*/}
          <Grid.Column width={7} className={css.firstRowText}>
            <div className={css.firstRowTextInner}>
              <h1>Instantly search through all of NEU's classes.</h1>
              <div className={css.allTextDesc}>Search through classes, professors, sections, and subjects at Northeastern. Going to add more stuff (like TRACE surveys) soon!</div>
              <Button onClick={() => {window.dispatchEvent(searchForCS2510Event)}} primary className={css.redButton}>Search for CS 2510</Button>
              <div className={css.firstRowMobilePadding}></div>
            </div>
          </Grid.Column>
          <Grid.Column width={9} className={css.rightSideFirstRow}>
            <div className={css.firstRowImgContainer}>
              
              <img className={css.cs2510Desktop} src={cs2510Desktop}/>
              <div className={css.rotatedDiv}></div>
            </div>
          </Grid.Column>
        </Grid>



        {/* Second Row. */}
        <Grid stackable  reversed="mobile" className={css.secondRow}>
          <Grid.Column width={9} className={css.secondRowImgContainer}>
            <img className = {css.engw1111Desktop} src={engw1111Desktop}/>
            <img className = {css.lernerMobile} src={lernerMobile}/>
            <div className={css.rotatedDivSecondRow}></div>
          </Grid.Column>
          <Grid.Column width={7} className={css.secondRowText}>
            <div className={css.secondRowTextInner}>
              <h1>Everything you could be looking for.</h1>
              <div className={css.allTextDesc}>See class descriptions, prereqs, coreqs, CRNs, professors, meetings, and locations! Even more stuff coming soon!</div>
              <Button onClick={() => {window.dispatchEvent(searchForENGW1111Event)}}  primary className={css.grayButton}>Search for ENGW 1111</Button>
            </div>
          </Grid.Column>
        </Grid>





         <Grid stackable className={css.thirdRow}>
          <Grid.Column width={7} className={css.thirdRowText}>
            <div className = {css.thirdRowTextInner}>
              <h1>Works great on mobile!</h1>
              <div className={css.allTextDesc}>holla holla</div>
              <Button onClick={() => {window.dispatchEvent(searchForOODEvent)}} primary className={css.redButton}>Search for OOD</Button>
            </div>
          </Grid.Column>
          <Grid.Column width={9} className={css.thirdRowImgContainer}>  
            <div  className={css.thirdRowImgContainerInner}>
              <div>
                <img className = {css.oodMobile1} src={oodMobile1}/>
                <img className = {css.oodMobile2} src={oodMobile2}/>
              </div>
              <div>
                <img className = {css.cs2500Mobile} src={cs2500Mobile}/>
                <img className = {css.cs2500Resultsmobile} src={cs2500Resultsmobile}/>
              </div>
              <div className={css.rotatedDivThirdRow}></div>
            </div>
          </Grid.Column>
        </Grid>
      </span>
    )
  }

}

// this was for mobile
// <div className={css.thirdRowPadding}> </div>


//             <div className={css.allTextDesc}>Search for classes, subjects, sections, professors, CRNs, and more. Instantly find what you are looking for.</div>




export default CSSModules(SplashPage, css);
