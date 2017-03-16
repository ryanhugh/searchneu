import React, { PropTypes } from 'react';
import CSSModules from 'react-css-modules';
import classNames from 'classnames/bind';

import css from './EmployeePanel.css';
import globe from './globe.svg';



const cx = classNames.bind(css);


// name, id, phone, emails, primaryappointment, primarydepartment, link, positions, office, personalSite, bigPictureLink
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

  render() {
    const employee = this.props.employee;

    // Create the address box
    const officeElements = [];
    if (employee.office) {
      const lines = employee.office.split('\r\n');

      lines.forEach((line, index) => {
        officeElements.push(line);
        if (lines.length - 1 !== index) {
          officeElements.push(<br key={ index } />);
        }
      });
    }


    const contactText = [];

    if (employee.positions) {
      employee.positions.forEach((position) => {
        contactText.push(position);
      });
    } else if (employee.primaryappointment) {
      contactText.push(employee.primaryappointment);
    }

    if (employee.primarydepartment) {
      contactText.push(employee.primarydepartment);
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

      contactText.push(<a href={ `tel:${phoneText}` }>{phoneText}</a>);
    }

    // Add <br/>s between the elements
    const contactElements = this.constructor.injectBRs(contactText)

    let linkElement = null
    if (employee.link) {
      linkElement = (
        <span className = {css.link}> 
          <a target='_blank' rel='noopener noreferrer' className={ css.inlineBlock } href={ employee.link }>
            <img src={ globe } alt='globe' />
          </a>
        </span>
      )
    }


    var links = []
    if (employee.link) {
      links.push(<a target='_blank' rel='noopener noreferrer' href={employee.link}>CCIS Profile</a>)
    }

    if (employee.personalSite) {
      links.push(<a target='_blank' rel='noopener noreferrer' href={employee.personalSite}>Personal Website</a>)
    }

    if (employee.googleScholarId) {
      links.push(<a target='_blank' rel='noopener noreferrer' href={'https://scholar.google.com/citations?user=' + employee.googleScholarId + '&hl=en&oi=ao'}>Google Scholar</a>)
    }

    links = this.constructor.injectBRs(links)

  // "link": "http://www.ccis.northeastern.edu/people/amal-ahmed/",
  // "personalSite": "http://www.ccs.neu.edu/home/amal/",
  // 'https://scholar.google.com/citations?user=' + googleScholarId + '&hl=en&oi=ao'
  // "googleScholarId": "Y1C007wAAAAJ",


    // data-tip={ `View on ${section.host}` }

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
