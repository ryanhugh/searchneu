/*
 * This file is part of Search NEU and is licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Checkbox } from 'semantic-ui-react';
import user from '../user';
import macros from '../macros';
import Keys from '../../../common/Keys';

// This file renders the checkboxes that control which sections a user signs up for
// notifications.

export default class NotifCheckBox extends Checkbox {


  // creates a new Notification Check Box that has the section's
  // hash in section, and sets checked to be the initial value of if the section
  // is currently in the user or not
  constructor(props) {
    super(props);

    const wantedSection = this.props.section;

    this.state.checked = user.hasSectionAlready(Keys.create(wantedSection).getHash());
    this.state.section = wantedSection;
      
  }

  // if the state is currently checked, uncheck, remove the section from the user's data
  // do opposite.
  // send data to backend
  handleChange = (e, { value }) => {
    if (this.state.checked) {
      this.setState({checked: false});
      user.removeSection(this.state.section);
    } else {
      this.setState({checked: true});
      user.enrollSection(this.state.section);
    }
    //user.sendData();
  }


  // renders the proper checkbox. If there are still seats, then make it read
  // only, otherwise, set up callback on onChange 
  render() {
    if (this.state.checked !== user.hasSectionAlready(Keys.create(this.state.section).getHash())) {
      macros.log('was called');
      this.state.checked = true;
    }
    if (this.props.seats) {
      return <Checkbox toggle readOnly/>
    } else {
      return <Checkbox toggle checked={this.state.checked} onChange = {this.handleChange}/>
    }
  }
  
}
