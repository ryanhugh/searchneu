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
    return  (
      <span>
        <div className={css.topPadding}></div>

        <Grid className={css.firstRow}>
          {/* These widths must add up to 16.*/}
          <Grid.Column width={9}>
            <img className = {css.cs2510Desktop} src={cs2510Desktop}/>
            <img className = {css.lernerMobile} src={lernerMobile}/>
          </Grid.Column>
          <Grid.Column width={7} className={css.rightSideFirstRow}>
            <h1>All of NEU's classes. Instantly Searchable.</h1>
            <div className={css.firstPanelDesc}>Easily search through classes, professors, sections, and subjects at Northeastern. Going to add more stuff (like TRACE surveys) soon!</div>
            <Button primary>Search for CS 2510</Button>
          </Grid.Column>
        </Grid>

        <div style={{height:'50px'}}></div>

        <div className='ui divider' />

        <Grid className={css.secondRow}>
          <Grid.Column width={7} className={css.leftSideSecondRow}>
            <h1>Everything you could be looking for.</h1>
            <div className={css.firstPanelDesc}>See class descriptions, Prereqs, Coreqs, CRNs, Professors, Meetings, and Locations!</div>
            <Button primary>Search for ENGW 1111</Button>
          </Grid.Column>
          <Grid.Column width={9} className={css.rightSideFirstRow}>
            <img className = {css.engw1111Desktop} src={engw1111Desktop}/>
          </Grid.Column>
        </Grid>


      </span>

    )
  }
  
}
//             <div className={css.firstPanelDesc}>Search for classes, subjects, sections, professors, CRNs, and more. Instantly find what you are looking for.</div>




export default CSSModules(SplashPage, css);