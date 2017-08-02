import React from 'react';
import PropTypes from 'prop-types';
import CSSModules from 'react-css-modules';

import css from './BaseClassPanel.css';
import macros from '../macros';


class BaseClassPanel extends React.Component {

  constructor(props) {
    super(props);

    this.state = this.getInitialRenderedSectionState();

    this.onShowMoreClick = this.onShowMoreClick.bind(this);
  }

  getInitialRenderedSectionState() {
    let sectionsShownByDefault;
    if (this.constructor.sectionsShownByDefault) {
      sectionsShownByDefault = this.constructor.sectionsShownByDefault
    }
    else {
      sectionsShownByDefault = macros.sectionsShownByDefault;
    }

    // Show 3 sections by default
    return {
      renderedSections: this.props.aClass.sections.slice(0, sectionsShownByDefault),
      unrenderedSections: this.props.aClass.sections.slice(sectionsShownByDefault),
    };
  }

  onShowMoreClick() {
    macros.log('Adding more sections to the bottom.');

    const newElements = this.state.unrenderedSections.splice(0, macros.sectionsAddedWhenShowMoreClicked);

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

  // Render the Show More.. Button
  // This is the same on both desktop and mobile.
  getShowMoreButton() {
  	if (this.state.unrenderedSections.length > 0) {

      return (
        <div className={ css.showMoreButton } onClick={ this.onShowMoreClick }>
          Show More...
        </div>
      );
    }
    else {
    	return null;
    }
  }

  getCreditsString() {
    // Figure out the credits string
    if (this.props.aClass.maxCredits === this.props.aClass.minCredits) {
      return `${this.props.aClass.minCredits} credits`;
    } else {
      return `${this.props.aClass.minCredits} to ${this.props.aClass.maxCredits} credits`;
    }
  }

}



BaseClassPanel.propTypes = {
  aClass: PropTypes.object.isRequired,
};

export default BaseClassPanel;
