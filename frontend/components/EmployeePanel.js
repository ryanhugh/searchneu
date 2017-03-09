import React, { PropTypes } from 'react';
import CSSModules from 'react-css-modules';
import ReactTooltip from 'react-tooltip';
import classNames from 'classnames/bind';

import globe from './globe.svg';
import css from './results.css';
import macros from './macros';

const cx = classNames.bind(css);


// EmployeePanel page component
class EmployeePanel extends React.Component {

  componentDidUpdate() {
    ReactTooltip.rebuild();
  }

  render() {
    const employee = this.props.employee;
   
    return (
      <div key={ aClass._id } className={ `${css.container} ui segment` }>
        <div className={ css.header }>
          {aClass.subject} {aClass.classId}: {aClass.name}
        </div>

        <div className={ css.body }>
         



      </div>
    );
  }
}

EmployeePanel.propTypes = {
  aClass: PropTypes.object.isRequired,
};


export default CSSModules(EmployeePanel, css);
