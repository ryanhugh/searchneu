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
    let officeElements = [];

    if (employee.officeRoom) {
      officeElements.push(employee.officeRoom)
    }

    officeElements = this.constructor.injectBRs(officeElements)

    const contactText = [];

     if (employee.primaryRole) {
      contactText.push(employee.primaryRole);
    }

    if (employee.primaryDepartment) {
      contactText.push(employee.primaryDepartment);
    }
    if (employee.emails) {
      employee.emails.forEach(function(email, index) {
        contactText.push(<a key={email} href={ `mailto:${email}` }>{email}</a>);
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

      contactText.push(<a key="tel" href={ `tel:${phoneText}` }>{phoneText}</a>);
    }

    // Add <br/>s between the elements
    const contactElements = this.constructor.injectBRs(contactText)

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


    var links = []
    if (employee.url) {
      links.push(<a key="link" target='_blank' rel='noopener noreferrer' href={employee.url}>NEU Profile</a>)
    }

    if (employee.personalSite) {
      links.push(<a key="personalSite" target='_blank' rel='noopener noreferrer' href={employee.personalSite}>Personal Website</a>)
    }

    links = this.constructor.injectBRs(links)

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
            {officeElements}
          </div>
          <div className={ css.inlineBlock +' '+ css.addressBox }>
            {links}
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
