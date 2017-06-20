import React from 'react';
import PropTypes from 'prop-types';
import CSSModules from 'react-css-modules';
import classNames from 'classnames/bind';

import macros from '../macros';
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

    let firstColumn = [];
    let secondColumn = []

     if (employee.primaryRole) {
      firstColumn.push(employee.primaryRole);
    }

    if (employee.primaryDepartment) {
      firstColumn.push(employee.primaryDepartment);
    }

    let contactRows = []

    if (employee.officeRoom) {
      contactRows.push(employee.officeRoom)
    }


    if (employee.emails) {
      employee.emails.forEach(function(email, index) {
        contactRows.push(<a key={email} href={ `mailto:${email}` }>{email}</a>);
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

      contactRows.push(<a key="tel" href={ `tel:${phoneText}` }>{phoneText}</a>);
    }

    if (macros.isMobile) {
      firstColumn = firstColumn.concat(contactRows)
    }
    else  {
      secondColumn = secondColumn.concat(contactRows)
    }

    if (employee.url && !macros.isMobile) {
      firstColumn.push(<a key="link" target='_blank' rel='noopener noreferrer' href={employee.url}>NEU Profile</a>)
    }
    
    if (employee.personalSite) {
      let element = <a key="personalSite" target='_blank' rel='noopener noreferrer' href={employee.personalSite}>Personal Website</a>
      if (macros.isMobile) {
        secondColumn.push(element)
      }
      else {
        firstColumn.push(element)
      }
    }

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
            {this.constructor.injectBRs(firstColumn)}
          </div>
          <div className={ cx({
            inlineBlock: true,
            mobileSecondColumn: macros.isMobile,
            desktopSecondColumn: !macros.isMobile
          }) }>
            {this.constructor.injectBRs(secondColumn)}
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
