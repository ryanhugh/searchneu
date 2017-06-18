import React from 'react';
import PropTypes from 'prop-types';
import CSSModules from 'react-css-modules';
import classNames from 'classnames/bind';

import css from './EmployeePanel.css';
import globe from './globe.svg';



const cx = classNames.bind(css);


// name, id, phone, emails, primaryRole, primaryDepartment, url, officeRoom, officeStreetAddress

// not standardized yet: personalSite, bigPictureLink
class EmployeePanel extends React.Component {

  static injectBRs(arr) {
    let retVal = []

    // Add <br/>s between the elements
    for (let i = 0; i < arr.length; i++) {
      const element = arr[i];
      retVal.push(element);
      if (arr.length - 1 !== i) {
        retVal.push(<br key={ i } />);
      }
    }

    return retVal
  }

  shouldComponentUpdate() {
    return false;
  }

  render() {
    const employee = this.props.employee;

    // Create the address box
    // let officeElements = [];

    
    // officeElements = this.constructor.injectBRs(officeElements)

    const profileTexts = [];

     if (employee.primaryRole) {
      profileTexts.push(employee.primaryRole);
    }

    if (employee.primaryDepartment) {
      profileTexts.push(employee.primaryDepartment);
    }

    if (employee.url) {
      profileTexts.push(<a key="link" target='_blank' rel='noopener noreferrer' href={employee.url}>NEU Profile</a>)
    }

    if (employee.personalSite) {
      profileTexts.push(<a key="personalSite" target='_blank' rel='noopener noreferrer' href={employee.personalSite}>Personal Website</a>)
    }


    let contactLinks = []

    if (employee.officeRoom) {
      contactLinks.push(employee.officeRoom)
    }


    if (employee.emails) {
      employee.emails.forEach(function(email, index) {
        contactLinks.push(<a key={email} href={ `mailto:${email}` }>{email}</a>);
      })
    }


    if (employee.phone) {
      const phone = [];
      phone.push(employee.phone.slice(0, 3));
      phone.push('-');
      phone.push(employee.phone.slice(3, 6));
      phone.push('-');
      phone.push(employee.phone.slice(6, 11));

      const phoneText = phone.join('');

      contactLinks.push(<a key="tel" href={ `tel:${phoneText}` }>{phoneText}</a>);
    }


    contactLinks = this.constructor.injectBRs(contactLinks)

    // Add <br/>s between the elements
    const contactElements = this.constructor.injectBRs(profileTexts)

    let linkElement = null
    if (employee.url) {
      linkElement = (
        <span className = {css.link}> 
          <a key="jfdalsj" target='_blank' rel='noopener noreferrer' className={ css.inlineBlock } href={ employee.url }>
            <img src={ globe } alt='globe' />
          </a>
        </span>
      )
    }

    return (
      <div className={ `${css.container} ui segment` }>
        <div className={ css.header }>
          {employee.name}
          {linkElement}
        </div>

        <div className={ css.body }>
          <div className={ `${css.inlineBlock} ${css.contactBox}` }>
            {contactElements}
          </div>
          <div className={ css.inlineBlock +' '+ css.addressBox }>
            {contactLinks}
          </div>
        </div>
      </div>
    );
  }
}

EmployeePanel.propTypes = {
  employee: PropTypes.object.isRequired,
};


export default CSSModules(EmployeePanel, css);
