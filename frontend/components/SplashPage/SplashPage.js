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

    const searchForCS2510Event = new CustomEvent(macros.searchEvent, { detail: 'CS 2510' });

    const searchForENGW1111Event = new CustomEvent(macros.searchEvent, { detail: 'ENGW 1111' });
    const searchForOODEvent = new CustomEvent(macros.searchEvent, { detail: 'OOD' });

    return  (
      <span>
        <div className={css.topPadding}></div>

        <Grid className={css.firstRow}>
          {/* These widths must add up to 16.*/}
          <Grid.Column width={9}>
            <div style={{paddingTop:'56%'}}> </div>
            <img className = {css.cs2510Desktop} src={cs2510Desktop}/>
            <img className = {css.lernerMobile} src={lernerMobile}/>
          </Grid.Column>
          <Grid.Column width={7} className={css.rightSideFirstRow}>
            <h1>All of NEU's classes. Instantly searchable.</h1>
            <div className={css.firstPanelDesc}>Easily search through classes, professors, sections, and subjects at Northeastern. Going to add more stuff (like TRACE surveys) soon!</div>
            <Button onClick={() => {window.dispatchEvent(searchForCS2510Event)}} primary>Search for CS 2510</Button>
          </Grid.Column>
        </Grid>

        <div style={{height:'50px'}}></div>

        <div className='ui divider' />

        <Grid className={css.secondRow}>
          <Grid.Column width={7} className={css.leftSideSecondRow}>
            <h1>Everything you could be looking for.</h1>
            <div className={css.firstPanelDesc}>See class descriptions, Prereqs, Coreqs, CRNs, Professors, Meetings, and Locations! Going to add even more stuff soon!</div>
            <Button onClick={() => {window.dispatchEvent(searchForENGW1111Event)}}  primary>Search for ENGW 1111</Button>
          </Grid.Column>
          <Grid.Column width={9} className={css.rightSideFirstRow}>
            <img className = {css.engw1111Desktop} src={engw1111Desktop}/>
          </Grid.Column>
        </Grid>

        <div style={{height:'50px'}}></div>

        <div className='ui divider' />

        <div style={{height:'50px'}}></div>


         <Grid className={css.thirdRow}>
          <Grid.Column width={9}>
            <div style={{paddingTop:'61%'}}> </div>
            <img className = {css.oodMobile1} src={oodMobile1}/>
            <img className = {css.oodMobile2} src={oodMobile2}/>
            <img className = {css.cs2500Mobile} src={cs2500Mobile}/>
            <img className = {css.cs2500Resultsmobile} src={cs2500Resultsmobile}/>
          </Grid.Column>
          <Grid.Column width={7} className={css.rightSideFirstRow}>
            <h1>Works great on mobile!</h1>
            <div className={css.firstPanelDesc}>holla holla</div>
            <Button onClick={() => {window.dispatchEvent(searchForOODEvent)}} primary>Search for OOD</Button>
          </Grid.Column>
        </Grid>

        <div style={{height:'50px'}}></div>

      </span>

    )
  }
  
}
//             <div className={css.firstPanelDesc}>Search for classes, subjects, sections, professors, CRNs, and more. Instantly find what you are looking for.</div>




export default CSSModules(SplashPage, css);