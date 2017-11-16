/*
 * This file is part of Search NEU and licensed under AGPL3. 
 * See the license file in the root folder for details. 
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';

import css from './WeekdayBoxes.css';

const cx = classNames.bind(css);

// This file is responsible for the weekday boxes, eg [][x][][][x] for Tuesday Friday
// And the string that appears when you hover over it (Meets on Tuesday, Friday)

class WeekdayBoxes extends React.Component {
  render() {

    // Don't render anything if the class is online. 
    if (this.props.section.online) {
      return null;
    }


    // Calculate the "Meets on Tuesday, Friday" or "No Meetings found" string that hovers over the weekday boxes
    const meetingDays = this.props.section.getWeekDaysAsStringArray();
    let meetingString;
    if (meetingDays.length === 0) {
      meetingString = 'No Meetings found';
    } else {
      meetingString = `Meets on ${meetingDays.join(', ')}`;
    }

    // Calculate the weekday boxes eg [][x][][][x] for Tuesday Friday
    let booleans = this.props.section.getWeekDaysAsBooleans();
    if (!this.props.section.meetsOnWeekends()) {
      booleans = booleans.slice(1, 6);
    }

    const booleanElements = booleans.map((meets, index) => {
      return (
        <div
          key={ index }
          className={ cx({
            weekDayBoxChecked: meets,
            weekDayBox: true,
          }) }
        />
      );
    });


    return (
      <div className={ `${css.inlineBlock} ${css.daysContainer}` } data-tip={ meetingString }>
        {booleanElements}
      </div>
    );
  }
}


WeekdayBoxes.propTypes = {
  section: PropTypes.object.isRequired,
};


export default WeekdayBoxes;
