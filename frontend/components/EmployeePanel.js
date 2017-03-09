import React, { PropTypes } from 'react';
import CSSModules from 'react-css-modules';
import ReactTooltip from 'react-tooltip';
import classNames from 'classnames/bind';

import globe from './globe.svg';
import css from './EmployeePanel.css';
import macros from './macros';

const cx = classNames.bind(css);


// EmployeePanel page component
class EmployeePanel extends React.Component {

// name, id, phone, email, primaryappointment, primarydepartment, link, positions, office, personalSite, bigPictureLink

  render() {
    const employee = this.props.employee;

    var lines = []
    if (employee.office) {
      lines = employee.office.split('\r\n')
    }
   
    return (
      <div className={ `${css.container} ui segment` }>
        <div className={ css.header }>
          {employee.name}
        </div>

        <div className={ css.body }>
          {employee.positions?employee.positions[0]:employee.primaryappointment}
          <br />
          {employee.primarydepartment}
          <br />
          {employee.email}
          <br />
          {employee.phone}
        </div>
        <div> 

          {lines[0]}
          <br/>
          {lines[1]}
          <br/>
          {lines[2]}

        </div>
      </div>
    );
  }
}

EmployeePanel.propTypes = {
  aClass: PropTypes.object.isRequired,
};


export default CSSModules(EmployeePanel, css);
