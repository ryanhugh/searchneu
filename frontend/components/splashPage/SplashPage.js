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

import { Grid, Segment, Divider } from 'semantic-ui-react'

import css from './SplashPage.css';
import macros from '../macros';

const cx = classNames.bind(css);

class SplashPage extends React.Component {

  render () {

    // <Segment className={css.firstContainer}>

        //<div className={css.firstRow}> 
        //<div className={css.imagesFirstRow}> Instantly
//
        //</div>
//
//
//
      //</div>


    return  (

      <span>
  
        <div className={css.topPadding}></div>

        <Grid>
          <Grid.Column width={9} className={css.firstRow}>
            <img className = {css.cs2510Desktop} src={cs2510Desktop}/>
            <img className = {css.lernerMobile} src={lernerMobile}/>
          </Grid.Column>
          <Grid.Column width={7}>
            <h1>All of NEU's classes. Instantly Searchable.</h1>
            <div>Search for classes, subjects, sections, professors, CRNs, and and more. Instantly find what you are looking for.</div>
            <a> Search for CS 2510 >></a>
          </Grid.Column>
        </Grid>
      </span>

    )
  }
  
}


export default CSSModules(SplashPage, css);