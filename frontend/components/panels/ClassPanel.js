import React from 'react';
import PropTypes from 'prop-types';
import CSSModules from 'react-css-modules';
import classNames from 'classnames/bind';

import globe from './globe.svg';
import css from './ClassPanel.css';
import MobileSectionPanel from './MobileSectionPanel';
import macros from '../macros';
import Keys from '../../../common/Keys';
import LocationLinks from './LocationLinks';
import WeekdayBoxes from './WeekdayBoxes';

const cx = classNames.bind(css);


// ClassPanel page component
class ClassPanel extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      renderedSections: props.aClass.sections.slice(0, 3),
      unrenderedSections: props.aClass.sections.slice(3),
    };


    this.onShowMoreClick = this.onShowMoreClick.bind(this);
  }

  onShowMoreClick() {
    console.log('Adding more sections to the bottom.');

    const newElements = this.state.unrenderedSections.splice(0, 5);

    this.setState({
      unrenderedSections: this.state.unrenderedSections,
      renderedSections: this.state.renderedSections.concat(newElements),
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.state.renderedSections.length !== nextState.renderedSections.length) {
      return true;
    }

    return false;
  }

  componentDidUpdate(prevProps, prevState) {
    macros.debounceTooltipRebuild();
  }

  componentDidMount() {
    macros.debounceTooltipRebuild();
  }

  shouldShowWaitlist() {
    const aClass = this.props.aClass;

    // If the class does not have a waitlist, don't show the waitlist
    if (!aClass.getHasWaitList()) {
      return false;
    }

    // If all the sections have 0 seats on the waitlist and 0 total seats, don't show the waitlist (because there isn't actually a waitlist).
    let foundSectionWithWaitlistSeats = false;

    for (const section of aClass.sections) {
      if (section.waitRemaining > 0 || section.waitCapacity > 0) {
        foundSectionWithWaitlistSeats = true;
        break;
      }
    }

    if (!foundSectionWithWaitlistSeats) {
      return false;
    }

    // Also show the waitlist if any of the sections have less than 10 seats left.
    // The number 10 is just an arbitrary decision and can be changed in the future.
    const foundSectionWithLessThanTenSeats = false;

    for (const section of aClass.sections) {
      if (section.seatsRemaining < 10) {
        return true;
      }
    }

    // If there are plenty of seats left, don't show the waitlist
    return false;
  }

  render() {
    const aClass = this.props.aClass;
    // Render the section table if this class has sections
    let sectionTable = null;
    if (aClass.sections && aClass.sections.length > 0) {
      // If this is mobile, use the mobile panels.
      if (macros.isMobile) {
        sectionTable = this.state.renderedSections.map((section) => {
          return <MobileSectionPanel key={ Keys.create(section).getHash() } section={ section } />;
        });
      } else {
        // Add the Exam column headers if there is any section in this class that has exam listed
        let examColumnHeaders = null;
        if (aClass.sectionsHaveExam()) {
          examColumnHeaders = [
            <th key='1'>Exam start</th>,
            <th key='2'>Exam end</th>,
            <th key='3'>Exam date</th>,
          ];
        }

        const showWaitList = this.shouldShowWaitlist();

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
                    displayNone: !showWaitList,
                  }) }
                > Waitlist seats </th>
                <th> Link </th>
              </tr>
            </thead>
            <tbody>
              {/* The CSS applied to the table stripes every other row, starting with the second one.
                This tr is hidden so the first visible row is a dark stripe instead of the second one. */}
              <tr style={{ display:'none', paddingTop: 0, paddingBottom: '1px' }} />
              {this.state.renderedSections.map((section) => {
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
                  <tr key={ Keys.create(section).getHash() }>
                    <td> {section.crn} </td>
                    <td> {section.getProfs().join(', ')} </td>
                    <td>
                      <WeekdayBoxes section={ section } />
                    </td>

                    <td>{section.getUniqueStartTimes().join(', ')}</td>
                    <td>{section.getUniqueEndTimes().join(', ')}</td>
                    {examElements}
                    <td>
                      <LocationLinks section={ section } />
                    </td>
                    <td>
                      <div data-tip='Open Seats/Total Seats' className={ css.inlineBlock }>
                        {section.seatsRemaining}/{section.seatsCapacity}
                      </div>
                    </td>

                    <td
                      className={ cx({
                        displayNone: !showWaitList,
                      }) }
                    >
                      <div data-tip='Open/Total Waitlist Seats' className={ css.inlineBlock }>
                        {section.waitRemaining}/{section.waitCapacity}
                      </div>
                    </td>

                    <td>
                      <a target='_blank' rel='noopener noreferrer' className={ css.inlineBlock } data-tip={ `View on ${section.host}` } href={ section.prettyUrl || section.url }>
                        <img src={ globe } alt='link' />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        );
      }
    }

    let showMoreSections = null;

    // Render the Show More.. Button
    if (this.state.unrenderedSections.length > 0) {
      showMoreSections = (<div className={ css.showMoreButton } onClick={ this.onShowMoreClick }>
        Show More...
      </div>);
    }


    // Figure out the credits string
    let creditsString;
    if (aClass.maxCredits === aClass.minCredits) {
      creditsString = `${aClass.minCredits} credits`;
    } else {
      creditsString = `${aClass.minCredits} to ${aClass.maxCredits} credits`;
    }

    return (
      <div>
        <div className={ `${css.container} ui segment` }>
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
          {showMoreSections}
        </div>
      </div>
    );
  }
}

ClassPanel.propTypes = {
  aClass: PropTypes.object.isRequired,
};


export default CSSModules(ClassPanel, css);
