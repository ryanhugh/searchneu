import React, { useRef } from 'react';
import cx from 'classnames';
import { Dropdown } from 'semantic-ui-react';
import logo from '../images/logo.svg';
import boston from '../images/boston.svg';
import macros from '../macros';

const ATTENTION_SECTION = {
  getInvolved: 'getInvolved',
  none: 'none',
};

const attentionSectionMode = ATTENTION_SECTION.getInvolved;

export default function Home() {
  // Styles for the search header and the boston outline at the bottom of the above-the-fold content.
  const bostonContainerStyle = {};
  const topHeaderStyle = {};
  const resultsContainerStyle = {};
  const hiddenHelpButton = '';

  const inputElement = useRef(null);

  const onKeyDown = (event) => {
    if (event.key !== 'Enter') {
      return;
    }

    if (macros.isMobile) {
      // Hide the keyboard on android phones.
      if (document.activeElement) {
        document.activeElement.blur();
      }
    }
    this.searchPageVisible = true;
    localStorage.searchPageVisible = this.searchPageVisible;
    this.onSearchDebounced(event.target.value);

    this.searchFromUserAction(event);
  }


  const onTermdropdownChange = (event, data) => {
    localStorage.selectedTermId = data.value;

    this.updateUrl(data.value, this.state.searchQuery);

    this.setState({
      selectedTermId: data.value,
    }, () => {
      if (this.state.searchQuery) {
        this.search(this.state.searchQuery, data.value);
      }
    });
  }


  // On mobile only show the logo and the github corner if there are no results and the search box is not focused (the virtual keyboard is not on the screen).
  let containerClassnames = 'home-container';
  if (macros.isMobile) {
    // Show the compact view unless there is nothing entered into the text box and the text box is not focused.
    // (Aka show the compact view when the input is focused, when there are results, or when there are no results).
    if (document.activeElement === inputElement) {
      containerClassnames += ' mobileCompact';
    } else {
      containerClassnames += ' mobileFull';
    }
  }


  const termDropDownOptions = [
    {
      text: 'Spring 2020',
      value: '202030',
    },
    {
      text: 'Fall 2019',
      value: '202010',
    },
    {
      text: 'Summer I 2019',
      value: '201940',
    },
    {
      text: 'Summer II 2019',
      value: '201960',
    },
    {
      text: 'Summer Full 2019',
      value: '201950',
    },
    {
      text: 'Spring 2019',
      value: '201930',
    },
  ];

  const wantToHelpOpacity = 1;
  let attentionSection = null;
  const actionCenterStyle = { opacity: wantToHelpOpacity, visibility: (wantToHelpOpacity === 0) ? 'hidden' : '' };

  if (attentionSectionMode === ATTENTION_SECTION.getInvolved) {
    attentionSection = (
      <div style={ actionCenterStyle } className='atentionContainer'>
        <p className='helpFistRow' />
        Help improve Search NEU
        <p>
          <a href='https://forms.gle/HNJ1AWTCXnu3XovKA' target='_blank' rel='noopener noreferrer' className={ `getInvolvedText ${hiddenHelpButton}` }>
            Take our survey
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

      <div className='bostonContainer' style={ bostonContainerStyle }>
        <img src={ boston } className='boston' alt='logo' />
      </div>

      <div>
        <div
          className={ cx({
            ui: true,
            center: true,
            spacing: true,
            aligned: true,
            icon: true,
            header: true,
            topHeader: true,
          }) }
          style={ topHeaderStyle }
        >
          <div className='centerTextContainer'>
            <>
              <h1 className='title'>
                Search For Northeastern
              </h1>
              <p className='subtitle'>
                Search for classes, professors, subjects, etc.
              </p>
            </>
            <div>
              <div className='sub header searchWrapper'>
                <label htmlFor='search_id'>
                  <i className='search icon' />
                </label>
                <input
                  type='search'
                  id='search_id'
                  autoComplete='off'
                  spellCheck='false'
                  tabIndex='0'
                  className='searchBox'
                  onKeyDown={ onKeyDown }
                  defaultValue={ searchQuery }
                  ref={ inputElement }
                />
              </div>
              <Dropdown
                fluid
                selection
                defaultValue={ selectedTermId }
                placeholder='Spring 2018'
                className='termDropdown'
                options={ termDropDownOptions }
                onChange={ onTermdropdownChange }
              />
            </div>
            {attentionSection}

            <div className='hitEnterToSearch'>
              Hit Enter to Search ...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
