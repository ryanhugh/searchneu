/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import PropTypes from 'prop-types';

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
    this.copyToClipboard = this.copyToClipboard.bind(this);
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


// TODOOOO
//   The show needs to clear the hide timeout
// Clean up the element added to the body


  // Takes in text to be copied to the clipboard. 
  // This process is longer than it seems like it should be... (thanks JS)
  // There is a new APi
  copyToClipboard(input) {

    // Try to copy with the new API, if it exists
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(target.innerText);
      return;
    }

    // If not, use a much longer process...
    const isRTL = document.documentElement.getAttribute('dir') == 'rtl';

    let container = document.body

    this.fakeHandlerCallback = () => this.removeFake();
    // this.fakeHandler = this.container.addEventListener('click', this.fakeHandlerCallback);

    this.fakeElem = document.createElement('textarea');
    // Prevent zooming on iOS
    this.fakeElem.style.fontSize = '12pt';
    // Reset box model
    this.fakeElem.style.border = '0';
    this.fakeElem.style.padding = '0';
    this.fakeElem.style.margin = '0';
    // Move element out of screen horizontally
    this.fakeElem.style.position = 'absolute';
    this.fakeElem.style[ isRTL ? 'right' : 'left' ] = '-9999px';
    // Move element to the same position vertically
    let yPosition = window.pageYOffset || document.documentElement.scrollTop;
    this.fakeElem.style.top = `${yPosition}px`;

    this.fakeElem.setAttribute('readonly', '');
    this.fakeElem.value = input;

    document.body.appendChild(this.fakeElem);

    // this.selectedText = select(this.fakeElem);

    var isReadOnly = this.fakeElem.hasAttribute('readonly');

    this.fakeElem.select();
    this.fakeElem.setSelectionRange(0, this.fakeElem.value.length);
    
    try {
       document.execCommand('copy');
    }
    catch (err) {
      console.log(err)
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
    }, 1250)


    this.copyToClipboard(target.innerText);
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

    // Events to run if the link is clicked on desktop
    // These will show a "Click to copy" when hovered
    // and a "Copied!" when it is clicked
    // If we want to enable this functionality on mobile too
    // use just the onClick method for mobile, and don't use the other two.
    let copyOnClickEvents = {
      onClick: this.copyOnClick,
      onMouseEnter: this.showTooltipOnEvent,
      onMouseLeave: this.hideTooltipOnEvent,
    }

    if (employee.emails) {
      employee.emails.forEach((email) => {

        let events;
        if (macros.isMobile) {
          events = {
            href: 'mailto:' + email
          }
        }
        else {
          events = copyOnClickEvents
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

      let events;
      if (macros.isMobile) {
        events = {
          href: 'tel:' + employee.phone
        }
      }
      else {
        events = copyOnClickEvents
      }


      contactRows.push(
        <a key='tel' data-tip='' className='employeePhone' role='button' tabIndex={ 0 } {...events}>
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
