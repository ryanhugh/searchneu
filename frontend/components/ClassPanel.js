import React, { PropTypes } from 'react';
import CSSModules from 'react-css-modules';
import ReactTooltip from 'react-tooltip';
import classNames from 'classnames/bind';

import globe from './globe.svg';
import css from './results.css';
import macros from './macros';

const cx = classNames.bind(css);


// ClassPanel page component
class ClassPanel extends React.Component {

  componentDidUpdate() {
    ReactTooltip.rebuild();
  }

  render() {
    const aClass = this.props.aClass;
    // Render the section table if this class has sections
    let sectionTable = null;
    if (aClass.sections && aClass.sections.length > 0) {
      // Add the Exam column headers if there is any section in this class that has exam listed
      let examColumnHeaders = null;
      if (aClass.sectionsHaveExam()) {
        examColumnHeaders = [
          <th key='1'>Exam start</th>,
          <th key='2'>Exam end</th>,
          <th key='3'>Exam date</th>,
        ];
      }

      sectionTable = (
        <table className={ `ui celled striped table ${css.resultsTable}` }>
          <thead>
            <tr>
              <th>
                <div className={ css.inlineBlock } data-tip='Course Reference Number'>
                    CRN
                  </div>
              </th>
              <th> Professors </th>
              <th> Weekdays </th>
              <th> Start </th>
              <th> End </th>
              {examColumnHeaders}
              <th> Location </th>
              <th> Seats </th>

              <th
                className={ cx({
                  displayNone: !aClass.getHasWaitList(),
                }) }
              > Waitlist seats </th>
              <th> Link </th>
            </tr>


          </thead>
          <tbody>
            {/* The CSS applied to the table stripes every other row, starting with the second one.
              This tr is hidden so the first visible row is a dark stripe instead of the second one. */}
            <tr style={{ display:'none' }} />
            {aClass.sections.map((section) => {
              // Calculate the "Meets on Tuesday, Friday" or "No Meetings found" string that hovers over the weekday boxes
              const meetingDays = section.getWeekDaysAsStringArray();
              let meetingString;
              if (meetingDays.length === 0) {
                meetingString = 'No Meetings found';
              } else {
                meetingString = `Meets on ${meetingDays.join(', ')}`;
              }

              // Calculate the weekday boxes eg [][x][][][x] for Tuesday Friday
              let booleans = section.getWeekDaysAsBooleans();
              if (!section.meetsOnWeekends()) {
                booleans = booleans.slice(1, 6);
              }

              const booleanElements = booleans.map((meets, index) => {
                return (
                  <div
                    key={ index } className={ cx({
                      weekDayBoxChecked: meets,
                      weekDayBox: true,
                    }) }
                  />
                );
              });

              // Calculate the Google Maps links
              const locationElements = section.getLocations().map((location, index, locations) => {
                let buildingName;
                if (location.match(/\d+\s*$/i)) {
                  buildingName = location.replace(/\d+\s*$/i, '');
                } else {
                  buildingName = location;
                }

                let optionalComma = null;
                if (index !== locations.length - 1) {
                  optionalComma = ',';
                }

                if (location.toUpperCase() === 'TBA') {
                  if (locations.length > 1) {
                    return null;
                  }

                  return 'TBA';
                }

                return (
                  <span key={ location }>
                    <a target='_blank' rel='noopener noreferrer' href={ `https://maps.google.com/?q=${macros.collegeName} ${buildingName}` }>
                      {location}
                    </a> {optionalComma}
                  </span>
                );
              });

              // Calculate the exam elements in each row
              let examElements = null;
              if (aClass.sectionsHaveExam()) {
                const examMoments = section.getExamMoments();
                if (examMoments) {
                  examElements = [
                    <td key='1'>{examMoments.start.format('h:mm a')}</td>,
                    <td key='2'>{examMoments.end.format('h:mm a')}</td>,
                    <td key='3'>{examMoments.start.format('MMM Do')}</td>,
                  ];
                } else {
                  examElements = [
                    <td key='1' />,
                    <td key='2' />,
                    <td key='3' />,
                  ];
                }
              }


              return (
                <tr key={ section._id }>
                  <td> {section.crn} </td>
                  <td> {section.getProfs().join(', ')} </td>
                  <td>
                    <div className={ css.inlineBlock } data-tip={ meetingString }>
                      {booleanElements}
                    </div>
                  </td>

                  <td>{section.getUniqueStartTimes().join(', ')}</td>
                  <td>{section.getUniqueEndTimes().join(', ')}</td>
                  {examElements}
                  <td>
                    {locationElements}
                  </td>
                  <td>
                    <div data-tip='Open Seats/Total Seats' className={ css.inlineBlock }>
                      {section.seatsRemaining}/{section.seatsCapacity}
                    </div>
                  </td>

                  <td
                    className={ cx({
                      displayNone: !aClass.getHasWaitList(),
                    }) }
                  >
                    <div data-tip='Open/Total Waitlist Seats' className={ css.inlineBlock }>
                      {section.waitRemaining}/{section.waitCapacity}
                    </div>
                  </td>

                  <td>
                    <a target='_blank' rel='noopener noreferrer' className={ css.inlineBlock } data-tip={ `View on ${section.host}` } href={ section.prettyUrl || section.url }>
                      <img src={ globe } alt='globe' />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

      );
    }


    // Render each class

    // Figure out the credits string
    let creditsString;
    if (aClass.maxCredits === aClass.minCredits) {
      creditsString = `${aClass.minCredits} credits`;
    } else {
      creditsString = `${aClass.maxCredits} to ${aClass.minCredits} credits`;
    }


    return (
      <div key={ aClass._id } className={ `${css.container} ui segment` }>
        <div className={ css.header }>
          {aClass.subject} {aClass.classId}: {aClass.name}
        </div>

        <div className={ css.body }>
          {aClass.desc}
          <br />
          <br />
          <div className={ css.leftPanel }>
            Prerequisites: {aClass.getPrereqsString()}
            <br />
            Corequisites: {aClass.getCoreqsString()}
          </div>
          <div className={ css.rightPanel }>
            Updated {aClass.getLastUpdateString()}
            <br />
            {creditsString}
          </div>
        </div>
        {sectionTable}
      </div>
    );
  }
}

ClassPanel.propTypes = {
  aClass: PropTypes.object.isRequired,
};


export default CSSModules(ClassPanel, css);
