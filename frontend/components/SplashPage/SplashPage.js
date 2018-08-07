/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import { Grid, Button } from 'semantic-ui-react';

import macros from '../macros';

import cs2500Mobile from './cs2500 mobile.png';
import cs2500Resultsmobile from './cs2500 results mobile.png';
import cs2510Desktop from './cs2510 desktop.png';
import engw1111Desktop from './engw1111 desktop.png';
import lernerMobile from './lerner mobile.png';
import oodMobile1 from './ood mobile 1.png';
import oodMobile2 from './ood mobile 2.png';


function SplashPage() {
  // Events that fire when the buttons are clicked.
  const searchForCS2510Event = new CustomEvent(macros.searchEvent, { detail: 'CS 2510' });
  const searchForENGW1111Event = new CustomEvent(macros.searchEvent, { detail: 'ENGW 1111' });
  const searchForOODEvent = new CustomEvent(macros.searchEvent, { detail: 'OOD' });

  return (
    <span id='splash-page'>

      {/* First Row. */}
      <Grid stackable className='row-first'>
        {/* These widths must add up to 16.*/}
        <Grid.Column width={ 7 } className='text'>
          <div className='text-inner'>
            <h1>
              Instantly search through all of NEU&apos;s classes.
            </h1>
            <div className='all-text-desc'>
              Search through classes, professors, sections, and subjects at Northeastern. Going to add more features soon!
            </div>
            <Button
              onClick={ () => { window.dispatchEvent(searchForCS2510Event); } }
              primary
              className='button-red'
            >
              Search for CS 2510
            </Button>
          </div>
        </Grid.Column>
        <Grid.Column width={ 9 } className='right-side'>
          <div className='img-container'>
            <img
              id='cs2510-desktop'
              src={ cs2510Desktop }
              alt='Example of a result of searching for CS2510'
            />
            <div className='rotated-div' />
          </div>
        </Grid.Column>
      </Grid>


      {/* Second Row. */}
      <Grid stackable reversed='mobile' className='row-second'>
        <Grid.Column width={ 9 } className='img-container'>
          <img
            id='engw1111-desktop'
            src={ engw1111Desktop }
            alt='Expanded view of a result of searching for ENGW1111'
          />
          <img id='lerner-mobile' src={ lernerMobile } alt='Mobile view example' />
          <div className='rotated-div' />
        </Grid.Column>
        <Grid.Column width={ 7 } className='text'>
          <div className='text-inner'>
            <h1>
              Everything you could be looking for.
            </h1>
            <div className='all-text-desc'>
              See class descriptions, prereqs, coreqs, CRNs, professors, meetings, and locations! Even more stuff coming soon!
            </div>
            <Button onClick={ () => { window.dispatchEvent(searchForENGW1111Event); } } primary className='button-grey'>
              Search for ENGW 1111
            </Button>
          </div>
        </Grid.Column>
      </Grid>

      {/* Third Row. */}
      <Grid stackable className='row-third'>
        <Grid.Column width={ 7 } className='text'>
          <div className='text-inner'>
            <h1>
              Works great on mobile!
            </h1>
            <div className='all-text-desc'>
              holla holla
            </div>
            <Button onClick={ () => { window.dispatchEvent(searchForOODEvent); } } primary className='button-red'>
              Search for OOD
            </Button>
          </div>
        </Grid.Column>
        <Grid.Column width={ 9 } className='img-container'>
          <div className='img-inner'>
            <div>
              <img id='oodMobile1' src={ oodMobile1 } alt='More mobile examples' />
              <img id='oodMobile2' src={ oodMobile2 } alt='More mobile examples' />
            </div>
            <div>
              <img id='cs2500Mobile' src={ cs2500Mobile } alt='More mobile examples' />
              <img id='cs2500Resultsmobile' src={ cs2500Resultsmobile } alt='More mobile examples' />
            </div>
            <div className='rotated-div' />
          </div>
        </Grid.Column>
      </Grid>
    </span>
  );
}


export default SplashPage;
