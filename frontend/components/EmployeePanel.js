import React, { PropTypes } from 'react';
import CSSModules from 'react-css-modules';
import classNames from 'classnames/bind';

import css from './EmployeePanel.css';

const cx = classNames.bind(css);


// EmployeePanel page component
class EmployeePanel extends React.Component {

// name, id, phone, email, primaryappointment, primarydepartment, link, positions, office, personalSite, bigPictureLink

  render() {
    const employee = this.props.employee;

    let lines = [];
    if (employee.office) {
      lines = employee.office.split('\r\n');
    }

    return (
      <div className={ `${css.container} ui segment` }>
        <div className={ css.header }>
          {employee.name}
        </div>

        <div className={ css.body }>
          {employee.positions ? employee.positions[0] : employee.primaryappointment}
          <br />
          {employee.primarydepartment}
          <br />
          {employee.email}
          <br />
          {employee.phone}
        </div>
        <div>

          {lines[0]}
          <br />
          {lines[1]}
          <br />
          {lines[2]}

        </div>
      </div>
    );
  }
}

EmployeePanel.propTypes = {
  employee: PropTypes.object.isRequired,
};


export default CSSModules(EmployeePanel, css);
