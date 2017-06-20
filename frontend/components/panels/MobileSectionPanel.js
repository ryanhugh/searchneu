import React from 'react';
import PropTypes from 'prop-types';
import CSSModules from 'react-css-modules';
import classNames from 'classnames/bind';

import globe from './globe.svg';
import css from './MobileSectionPanel.css';

import WeekdayBoxes from './WeekdayBoxes';
import LocationLinks from './LocationLinks';

const cx = classNames.bind(css);

// TODO:
// Waitlist UI/wording could be cleaned up/simplified a bit.

// MobileSectionPanel page component
class MobileSectionPanel extends React.Component {

  // Return just the first name and the last name.
  getNameWithoutMiddleName() {
    const prof = this.props.section.getProfs()[0];
    const indexOfFirstSpace = prof.indexOf(' ');

    // No spaces in this name.
    if (indexOfFirstSpace === -1) {
      return prof;
    }
    const indexOfLastSpace = prof.length - prof.split('').reverse().join('').indexOf(' ');
    const newName = `${prof.slice(0, indexOfFirstSpace)} ${prof.slice(indexOfLastSpace)}`;
    return newName;
  }

  render() {
    // Add another row for seats remaining on the waitlist if any exist.
    let waitlistRow = null;
    const hasWaitList = this.props.section.getHasWaitList();
    if (hasWaitList) {
      waitlistRow = (
        <tr className={ css.lastRow }>
          <td className={ css.firstColumn }>Wait</td>
          <td className={ css.secondColumn }>
            {this.props.section.waitRemaining}/{this.props.section.waitCapacity} Waitlist Seats Avalible
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

    // Add a row for exam, if the section has an exam.
    let examRow = null;
    if (this.props.section.getHasExam()) {
      const examMoments = this.props.section.getExamMoments();
      if (examMoments) {
        examRow = (
          <tr>
            <td className={ css.firstColumn }>Exam</td>
            <td className={ css.secondColumn }>
              {examMoments.start.format('MMMM Do @ h:mm a')}
            </td>
          </tr>
      );
      }
    }

    return (
      <div className={ css.container }>
        <div className={ css.globe }>
          <a target='_blank' rel='noopener noreferrer' href={ this.props.section.prettyUrl || this.props.section.url }>
            <img src={ globe } alt='link' />
          </a>
        </div>

        <div className={ css.title }>{`${this.getNameWithoutMiddleName()} @ ${meetingMoments[0].start.format('h:mm a')}`}</div>
        <table className={ css.table }>
          <tbody>
            <tr className={ css.firstRow }>
              <td className={ css.firstColumn }>CRN</td>
              <td className={ css.secondColumn }>{this.props.section.crn}</td>
            </tr>
            <tr>
              <td className={ css.firstColumn }>Profs</td>
              <td className={ css.secondColumn }>{this.props.section.getProfs().join(', ')}</td>
            </tr>
            <tr>
              <td className={ css.firstColumn }>Place</td>
              <td className={ css.secondColumn }>
                <LocationLinks section={ this.props.section } />
              </td>
            </tr>
            <tr>
              <td className={ css.firstColumn }>Times</td>
              <td className={ css.secondColumn }>
                {times.join(', ')}
              </td>
            </tr>
            <tr>
              <td className={ css.firstColumn }>Days</td>
              <td className={ css.secondColumn }>
                <WeekdayBoxes section={ this.props.section } />
              </td>
            </tr>
            {examRow}
            <tr className={ cx({
              lastRow: !hasWaitList,
            }) }
            >
              <td className={ css.firstColumn }>Seats</td>
              <td className={ css.secondColumn }>
                {this.props.section.seatsRemaining}/{this.props.section.seatsCapacity} Avalible
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


export default CSSModules(MobileSectionPanel, css);
