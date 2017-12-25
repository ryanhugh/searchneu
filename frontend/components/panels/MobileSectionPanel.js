/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import PropTypes from 'prop-types';

import macros from '../macros';
import WeekdayBoxes from './WeekdayBoxes';
import LocationLinks from './LocationLinks';

import globe from './globe.svg';
import './MobileSectionPanel.scss';

// TODO:
// Waitlist UI/wording could be cleaned up/simplified a bit.

// MobileSectionPanel page component
export default class MobileSectionPanel extends React.Component {
  // This is different than the one in ClassPanel.js because this can show and hide the waitlist based on a per-section basis
  // and ClassPanel.js is show it for all sections or none.
  shouldShowWaitlist() {
    if (this.props.section.getHasWaitList() && this.props.section.seatsRemaining < 10) {
      return true;
    }

    return false;
  }

  render() {
    // Add another row for seats remaining on the waitlist if any exist.
    let waitlistRow = null;
    const hasWaitList = this.shouldShowWaitlist();
    if (hasWaitList) {
      waitlistRow = (
        <tr className='lastRow'>
          <td className='firstColumn'>Wait</td>
          <td className='secondColumn'>
            {this.props.section.waitRemaining}/{this.props.section.waitCapacity} Waitlist Seats Available
          </td>
        </tr>
      );
    }

    // Create the 4:35 - 5:40 pm string.
    const meetingMoments = this.props.section.getAllMeetingMoments();
    const times = [];
    meetingMoments.forEach((time) => {
      const startString = time.start.format('h:mm');
      const endString = time.end.format('h:mm a');
      const combinedString = `${startString} - ${endString}`;
      if (!times.includes(combinedString)) {
        times.push(combinedString);
      }
    });


    let fullTimesString;
    if (times.length > 0) {
      fullTimesString = times.join(', ');
    } else {
      fullTimesString = 'TBA';
    }


    // Add a row for exam, if the section has an exam.
    let examRow = null;
    if (this.props.section.getHasExam()) {
      const examMeeting = this.props.section.getExamMeeting();
      if (examMeeting) {
        const examDayMoment = examMeeting.endDate;
        const examTimeMoment = examMeeting.times[0][0].start;


        examRow = (
          <tr>
            <td className='firstColumn'>Exam</td>
            <td className='secondColumn'>
              {examDayMoment.format('MMMM Do @ ') + examTimeMoment.format('h:mm a')}
            </td>
          </tr>
        );
      }
    }

    // Calculate the end of the title, which depends on whether the class is an online class and whether it has a start time yet.
    let titleEnding;
    if (this.props.section.online) {
      titleEnding = '-  Online Class';
    } else if (meetingMoments.length > 0) {
      titleEnding = `@ ${meetingMoments[0].start.format('h:mm a')}`;
    } else {
      titleEnding = '@ TBA';
    }


    return (
      <div className='section-container'>
        <div className='globe'>
          <a target='_blank' rel='noopener noreferrer' href={ this.props.section.prettyUrl || this.props.section.url }>
            <img src={ globe } alt='link' />
          </a>
        </div>

        <div className='title'>{`${macros.stripMiddleName(this.props.section.getProfs()[0])} ${titleEnding}`}</div>
        <table>
          <tbody>
            <tr className='firstRow'>
              <td className='firstColumn' >CRN</td>
              <td className='secondColumn' >{this.props.section.crn}</td>
            </tr>
            <tr>
              <td className='firstColumn' >Profs</td>
              <td className='secondColumn' >{this.props.section.getProfs().join(', ')}</td>
            </tr>
            <tr style={{ display: this.props.section.online && 'none' }}>
              <td className='firstColumn' >Place</td>
              <td className='secondColumn' >
                <LocationLinks section={ this.props.section } />
              </td>
            </tr>
            <tr style={{ display: this.props.section.online && 'none' }}>
              <td className='firstColumn' >Times</td>
              <td className='secondColumn' >
                {fullTimesString}
              </td>
            </tr>
            <tr style={{ display: this.props.section.online && 'none' }}>
              <td className='firstColumn' >Days</td>
              <td className='secondColumn' >
                <WeekdayBoxes section={ this.props.section } />
              </td>
            </tr>
            {examRow}
            <tr style={{ display: hasWaitList && 'none' }}>
              <td className='firstColumn' >Seats</td>
              <td className='secondColumn' >
                {this.props.section.seatsRemaining}/{this.props.section.seatsCapacity} Available
              </td>
            </tr>
            {waitlistRow}
          </tbody>
        </table>
      </div>
    );
  }
}


MobileSectionPanel.propTypes = {
  section: PropTypes.object.isRequired,
};
