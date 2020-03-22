/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import cx from 'classnames';
import { useQueryParam, StringParam } from 'use-query-params';
import SearchBar from '../ResultsPage/SearchBar';
import logo from '../images/logo.svg';
import boston from '../images/boston.svg';
import macros from '../macros';
import SplashPage from '../SplashPage/SplashPage';
import Footer from '../Footer';
import TermDropdown, { termDropDownOptions } from '../ResultsPage/TermDropdown';


const ATTENTION_SECTION = {
  getInvolved: 'getInvolved',
  none: 'none',
};

const attentionSectionMode = ATTENTION_SECTION.getInvolved;

// The lastest term
const LATEST_TERM = '202110';

const AVAILABLE_TERMS = termDropDownOptions.map((t) => { return t.value; });

export default function Home() {
  const history = useHistory();
  const [termId = LATEST_TERM, setTermId] = useQueryParam('termId', StringParam); // Default to LATEST if term not in params
  // Redirect to latest if we're at an old term
  if (!AVAILABLE_TERMS.includes(termId)) {
    setTermId(LATEST_TERM);
  }

  const [searchFocused, setSearchFocused] = useState(false);

  // On mobile only show the logo and the github corner if there are no results and the search box is not focused (the virtual keyboard is not on the screen).
  let containerClassnames = 'home-container';
  if (macros.isMobile && searchFocused) {
    containerClassnames += ' mobileCompact';
  }

  let attentionSection = null;
  const actionCenterStyle = { opacity: 1 };

  if (attentionSectionMode === ATTENTION_SECTION.getInvolved) {
    attentionSection = (
      <div style={ actionCenterStyle } className='atentionContainer'>
        <p className='helpFistRow' />
        Help improve Search NEU
        <p>
          <a href='https://forms.gle/HNJ1AWTCXnu3XovKA' target='_blank' rel='noopener noreferrer' className='getInvolvedText'>
            Take our survey &gt;
          </a>
        </p>
      </div>
    );
  }

  // Not totally sure why, but this height: 100% removes the extra whitespace at the bottom of the page caused by the upward translate animation.
  // Actually it only removes the extra whitespace on chrome. Need to come up with a better solution for other browsers.
  return (
    <div className={ containerClassnames }>
      <a target='_blank' rel='noopener noreferrer' href='https://github.com/sandboxnu/searchneu' className='githubCornerContainer'>
        <svg width='80' height='80' viewBox='0 0 250 250'>
          <path d='M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z' />
          <path d='M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2' fill='currentColor' className='octopusArm' />
          <path d='M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z' fill='currentColor' />
        </svg>
      </a>

      <img src={ logo } className='logo' alt='logo' />

      <div className='bostonContainer'>
        <img src={ boston } className='boston' alt='logo' />
      </div>

      <div>
        <div
          className={ cx({ // TODO: Take this out and restyle this monstrosity from scratch
            ui: true,
            center: true,
            spacing: true,
            aligned: true,
            icon: true,
            header: true,
            topHeader: true,
          }) }
        >
          <div className='centerTextContainer'>
            <h1 className='title'>
              Search For Northeastern
            </h1>
            <p className='subtitle'>
              Search for classes, professors, subjects, etc.
            </p>
            <div
              className='searchWrapper'
              onFocus={ () => { setSearchFocused(true); } }
              onBlur={ () => { setSearchFocused(false); } }
            >
              <SearchBar
                onSearch={ (q) => { history.push(`/${termId}/${q}`); } }
                query=''
              />
            </div>
            <TermDropdown
              termId={ termId }
              onChange={ setTermId }
            />

            <div className={ cx({
              hitEnterToSearch: true,
              hitEnterToSearchVisible: searchFocused,
            }) }
            >
              Hit Enter to Search ...
            </div>
            {attentionSection}
          </div>
        </div>
        <SplashPage />
        <Footer />
      </div>
    </div>
  );
}
