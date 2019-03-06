/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import PropTypes from 'prop-types';

import copyToClipboard from 'copy-text-to-clipboard';
import ReactTooltip from 'react-tooltip';

import macros from '../macros';

import globe from './globe.svg';
import chevronDown from './chevron-down.svg';
import chevronRight from './chevron-right.svg';

// On Mobile, display everything in two sections, one below the other, eg:
// Assistant Teaching Professor
// CCIS
// 310B West Village H
// l.razzaq@northeastern.edu
// lrazzaq@ccs.neu.edu
// 617-373-5797
//
// Personal Website


// And on desktop, display two equally sized sections right next to each other, eg:

// Assistant Teaching Professor
// CCIS
// NEU Profile
// Personal Website
//
// 310B West Village H
// l.razzaq@northeastern.edu
// lrazzaq@ccs.neu.edu
// 617-373-5797


// name, id, phone, emails, primaryRole, primaryDepartment, url, officeRoom, officeStreetAddress are all standardized across different data sources.
// The other fields may be present for one (eg, COE), but are not common enough to be used.

// not standardized yet: personalSite, bigPictureLink
export default class EmployeePanel extends React.Component {
  static propTypes = {
    employee: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      showMoreThanTitle: false,
    };

    this.toggleShowMoreThanTitle = this.toggleShowMoreThanTitle.bind(this);
    this.copyToClipboardOldMode = this.copyToClipboardOldMode.bind(this);
    this.copyOnClick = this.copyOnClick.bind(this);
    this.hideTooltipOnEvent = this.hideTooltipOnEvent.bind(this);
    this.showTooltipOnEvent = this.showTooltipOnEvent.bind(this);
  }

  injectBRs(arr) {
    const retVal = [];

    // Add <br/>s between the elements
    for (let i = 0; i < arr.length; i++) {
      const element = arr[i];
      retVal.push(element);
      if (arr.length - 1 !== i) {
        retVal.push(<br key={ i } />);
      }
    }

    return retVal;
  }

  toggleShowMoreThanTitle() {
    this.setState((state) => {
      return {
        showMoreThanTitle: !state.showMoreThanTitle,
      };
    });
  }

  copyToClipboardOldMode_backup(input) {
    const el = document.createElement('textarea');

    console.log("Attempting to copy", input)

    el.value = input;

    // Prevent keyboard from showing on mobile
    // el.setAttribute('readonly', '');

    el.style.contain = 'strict';
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    el.style.fontSize = '12pt'; // Prevent zooming on iOS

    const selection = document.getSelection();
    let originalRange = false;
    if (selection.rangeCount > 0) {
      originalRange = selection.getRangeAt(0);
    }

    document.body.appendChild(el);
    el.select();

    // Explicit selection workaround for iOS
    el.selectionStart = 0;
    el.selectionEnd = input.length;

    let success = false;
    try {
      success = document.execCommand('copy');
    } catch (err) {}

    document.body.removeChild(el);

    if (originalRange) {
      selection.removeAllRanges();
      selection.addRange(originalRange);
    }
  }

  copyToClipboardOldMode(input) {

    console.log("Attempting to copy", input)

    let textarea;
    let result;
    
    try {
      textarea = document.createElement('textarea');
      textarea.setAttribute('readonly', true);
      textarea.setAttribute('contenteditable', true);
      textarea.style.position = 'fixed'; // prevent scroll from jumping to the bottom when focus is set.
      textarea.value = input;

      document.body.appendChild(textarea);

      textarea.focus();
      textarea.select();

      const range = document.createRange();
      range.selectNodeContents(textarea);

      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);

      textarea.setSelectionRange(0, textarea.value.length);
      result = document.execCommand('copy');
    } catch (err) {
      console.error(err);
      result = null;
    } finally {
      document.body.removeChild(textarea);
    }
  }

  copyOnClick(event) {
    event.target.setAttribute('data-tip', 'Copied!');
    console.log("changing text to click to copied!")

    let target = event.target;

    ReactTooltip.show(target);

    // Start a timer to hide the target
    setTimeout(() => {

      // Check to make sure it is still in the document
      if (document.contains(target)) {
        ReactTooltip.hide(target);
      }
    }, 750)



    // Try to copy with the new API, if it exists
    // if (navigator.clipboard && navigator.clipboard.writeText) {
    //   navigator.clipboard.writeText(target.innerText);
    //   return;
    // }

    // If not, use a npm module that does it the old way.
    this.copyToClipboardOldMode(target.innerText);
  }

  showTooltipOnEvent(event) {
    event.target.setAttribute('data-tip', 'Click to copy');
    console.log("changing text to click to copy")
    ReactTooltip.show(event.target);
  }

  hideTooltipOnEvent(event) {
    ReactTooltip.hide(event.target);
  }

  render() {
    const employee = this.props.employee;

    // Create the address box

    let firstColumn = [];
    let secondColumn = [];

    if (employee.primaryRole) {
      firstColumn.push(employee.primaryRole);
    }

    if (employee.primaryDepartment) {
      firstColumn.push(employee.primaryDepartment);
    }

    const contactRows = [];

    if (employee.officeRoom) {
      contactRows.push(employee.officeRoom);
    }


    if (employee.emails) {
      employee.emails.forEach((email) => {


        // If is mobile, just show the "Copied!" tooltip when the user presses on the link
        let events;
        if (macros.isMobile) {
          events = {
            onClick: this.copyOnClick
          }
        }
        else {

          // On desktop, show more info when the link is hovered over
          events = {
            onClick: this.copyOnClick,
            onMouseEnter: this.showTooltipOnEvent,
            onMouseLeave: this.hideTooltipOnEvent,
          }
        }


        contactRows.push(
          <a
            key={ email }
            className='employeeEmail'
            data-tip=''
            role='button'
            tabIndex={ 0 }
            {...events}
          >
            {email}
          </a>,
        );
      });
    }


    if (employee.phone) {
      const phone = [];
      phone.push(employee.phone.slice(0, 3));
      phone.push('-');
      phone.push(employee.phone.slice(3, 6));
      phone.push('-');
      phone.push(employee.phone.slice(6, 11));

      const phoneText = phone.join('');

      contactRows.push(
        <a key='tel' data-tip='' className='employeePhone' onMouseEnter={ this.showTooltipOnEvent } onMouseLeave={ this.hideTooltipOnEvent } onClick={ this.copyOnClick } role='button' tabIndex={ 0 }>
          {phoneText}
        </a>,
      );
    }

    if (macros.isMobile) {
      firstColumn = firstColumn.concat(contactRows);
    } else {
      secondColumn = secondColumn.concat(contactRows);
    }

    if (employee.url && !macros.isMobile) {
      firstColumn.push(
        <a key='link' target='_blank' rel='noopener noreferrer' href={ employee.url }>
          NEU Profile
        </a>,
      );
    }

    if (employee.personalSite) {
      const element = (
        <a key='personalSite' target='_blank' rel='noopener noreferrer' href={ employee.personalSite }>
          Personal Website
        </a>
      );
      if (macros.isMobile) {
        secondColumn.push(element);
      } else {
        firstColumn.push(element);
      }
    }


    // Decide which chevron to use based on whether the panel is expanded or not. (Mobile only)
    let chevronSource = null;
    let chevron = null;
    if (macros.isMobile) {
      if (this.state.showMoreThanTitle) {
        chevronSource = chevronDown;
      } else {
        chevronSource = chevronRight;
      }

      chevron = <img className='chevron' src={ chevronSource } alt='' />;
    }

    // Set up the onclick listener, if this is mobile.
    let titleClickListener = null;
    if (macros.isMobile) {
      titleClickListener = this.toggleShowMoreThanTitle;
    }


    let linkElement = null;
    if (employee.url && !macros.isMobile) {
      linkElement = (
        <span className='classGlobeLink'>
          <a
            data-tip={ `View on ${macros.collegeHost}` }
            key='0'
            target='_blank'
            rel='noopener noreferrer'
            className='inlineBlock'
            href={ employee.url }
          >
            <img src={ globe } alt='globe' />
          </a>
        </span>
      );
    }

    return (
      <div className='employee-panel-container ui segment'>
        <div
          className='header'
          onClick={ titleClickListener }
          role='button'
          tabIndex={ 0 }
        >
          {chevron}
          <span className='titleText'>
            {employee.name}
          </span>
          {linkElement}
        </div>

        <div
          className='body'
          style={{
            display: (!this.state.showMoreThanTitle && macros.isMobile) && 'none',
            padding: 20,
          }}
        >
          <div className='inlineBlock contact-box'>
            {this.injectBRs(firstColumn)}
          </div>
          <div className='employee-panel-second-column'>
            {this.injectBRs(secondColumn)}
          </div>
        </div>
      </div>
    );
  }
}
