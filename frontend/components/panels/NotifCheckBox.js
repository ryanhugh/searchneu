/*
 * This file is part of Search NEU and is licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import { Checkbox } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import user from '../user';
import macros from '../macros';
import Keys from '../../../common/Keys';

// This file renders the checkboxes that control which sections a user signs up for
// notifications.

export default class NotifCheckBox extends React.Component {
  static propTypes = {
    section: PropTypes.object.isRequired,
  }

  // creates a new Notification Check Box that has the section's
  // hash in section, and sets checked to be the initial value of if the section
  // is currently in the user or not
  constructor(props) {
    super(props);

    const wantedSection = this.props.section;

    this.state = {};
    this.state.checked = user.hasSectionAlready(Keys.getSectionHash(wantedSection));
    this.state.section = wantedSection;
    this.doChange = this.doChange.bind(this);
  }

  // if the state is currently checked, uncheck, remove the section from the user's data
  // do opposite.
  // send data to backend
  doChange() {
    if (this.state.checked) {
      user.removeSection(this.state.section);
      this.setState({ checked: false });
    } else {
      user.enrollSection(this.state.section);
      this.setState({ checked: true });
    }
    user.sendUserData();
  }


  // renders the proper checkbox. If there are still seats, then make it read
  // only, otherwise, set up callback on onChange
  render() {
    if (this.state.checked !== user.hasSectionAlready(Keys.getSectionHash(this.state.section))) {
      macros.log('ipe', this.state.checked, user.hasSectionAlready(Keys.getSectionHash(this.state.section)));
      this.state.checked = !this.state.checked;
    }
    if (this.state.section && this.state.section.seatsRemaining) {
      return <Checkbox toggle readOnly />;
    }
    return <Checkbox toggle checked={ this.state.checked } onChange={ this.doChange } />;
  }
}
