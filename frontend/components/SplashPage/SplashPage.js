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

// seanstuff
import TabPanel from 'react-tab-panel'
import 'react-tab-panel/index.css'



const cx = classNames.bind(css);

class SplashPage extends React.Component {

  render () {

    const searchForCS2510Event = new CustomEvent(macros.searchEvent, { detail: 'CS 2510' });

    const searchForENGW1111Event = new CustomEvent(macros.searchEvent, { detail: 'ENGW 1111' });
    const searchForLernerEvent = new CustomEvent(macros.searchEvent, { detail: 'Ben Lerner' });

    return  (
      <div className = {css.splashPage}>

      <TabPanel>
        <div tabTitle="First Tab">
          First tab contents here
        </div>

        <div tabTitle="Second Tab">
          Content for second tab here
        </div>
      </TabPanel>

      </div>

    )
  }

}
//             <div className={css.firstPanelDesc}>Search for classes, subjects, sections, professors, CRNs, and more. Instantly find what you are looking for.</div>




export default CSSModules(SplashPage, css);
