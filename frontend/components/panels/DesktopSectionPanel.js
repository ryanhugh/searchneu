/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import PropTypes from 'prop-types';
import CSSModules from 'react-css-modules';
import classNames from 'classnames/bind';

import globe from './globe.svg';
import css from './DesktopSectionPanel.css';
import Keys from '../../../common/Keys';

import LocationLinks from './LocationLinks';
import WeekdayBoxes from './WeekdayBoxes';

const cx = classNames.bind(css);


class DesktopSectionPanel extends React.Component {
  // Create the 4:35 - 5:40 pm string.
  // This was copied from mobile section panel.js
  // TODO: deduplicate
  getTimeStingFromMeetings(meetingMoments) {
    const times = [];
    meetingMoments.forEach((time) => {
      const startString = time.start.format('h:mm');
      const endString = time.end.format('h:mm a');
      const combinedString = `${startString} - ${endString}`;
      if (!times.includes(combinedString)) {
        times.push(combinedString);
      }
    });
    return times.join(', ');
  }


  render() {
    // Instead of calculating a lot of these individually and putting them together in the return call
    // Append to this array as we go.
    // So the logic can be separated into distinct if statements.
    const tdElements = [];

    // If it is online, just put one super wide cell
    if (this.props.section.online) {
      // How many cells to span
      // need to span more cells if final exam columns are being shown.
      let length = 3;
      if (this.props.shouldShowExamColumns) {
        length = 6;
      }

      const onlineElement =
      (
        <td key='onlineWideCell' colSpan={ length } className={ css.wideOnlineCell }>
          <span className={ css.onlineDivLineContainer }>
            <span className={ `${css.onlineDivLine} ${css.onlineLeftLine}` } />
            <span>Online Class</span>
            <span className={ css.onlineDivLine } />
          </span>
        </td>
      );

      tdElements.push(onlineElement);

    // Have individual cells for the different columns
    } else {
      const meetingMoments = this.props.section.getAllMeetingMoments();
      const meetingStrings = this.getTimeStingFromMeetings(meetingMoments);

      const examMeeting = this.props.section.getExamMeeting();

      let examTimeString = null;
      if (examMeeting) {
        examTimeString = this.getTimeStingFromMeetings(examMeeting.times[0]);
      }


      tdElements.push(<td key='weekDayBoxes'> <WeekdayBoxes section={ this.props.section } /> </td>);
      tdElements.push(<td key='times'>{meetingStrings}</td>);
      tdElements.push(<td key='locationLinks'> <LocationLinks section={ this.props.section } /> </td>);

      // If there are exams, fill in those cells too
      // Calculate the exam elements in each row
      if (this.props.shouldShowExamColumns) {
        const sectionExamMeeting = this.props.section.getExamMeeting();
        if (examMeeting) {
          tdElements.push(<td key='exam1'>{examTimeString}</td>);
          tdElements.push(<td key='exam3'>{sectionExamMeeting.endDate.format('MMM Do')}</td>);
          tdElements.push(<td key='exam4'>{sectionExamMeeting.where}</td>);
        } else {
          tdElements.push(<td key='exam5' />);
          tdElements.push(<td key='exam6' />);
          tdElements.push(<td key='exam7' />);
        }
      }
    }


    return (
      <tr key={ Keys.create(this.props.section).getHash() }>
        <td> {this.props.section.crn} </td>
        <td> {this.props.section.getProfs().join(', ')} </td>

        {tdElements}

        <td>
          <div data-tip='Open Seats/Total Seats' className={ css.inlineBlock }>
            {this.props.section.seatsRemaining}/{this.props.section.seatsCapacity}
          </div>
        </td>

        <td
          className={ cx({
            displayNone: !this.props.showWaitList,
          }) }
        >
          <div data-tip='Open/Total Waitlist Seats' className={ css.inlineBlock }>
            {this.props.section.waitRemaining}/{this.props.section.waitCapacity}
          </div>
        </td>

        <td>
          <a target='_blank' rel='noopener noreferrer' className={ `${css.inlineBlock} ${css.sectionGlobe}` } data-tip={ `View on ${this.props.section.host}` } href={ this.props.section.prettyUrl || this.props.section.url }>
            <img src={ globe } alt='link' />
          </a>
        </td>
      </tr>
    );
  }
}


DesktopSectionPanel.propTypes = {
  shouldShowExamColumns: PropTypes.bool.isRequired,
  showWaitList: PropTypes.bool.isRequired,
  section: PropTypes.object.isRequired,
};


export default CSSModules(DesktopSectionPanel, css);
