/*
 * This file is part of Search NEU and is licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import { Checkbox, Icon } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import user from '../user';
import Keys from '../../../common/Keys';
import macros from '../macros';

// This file renders the checkboxes that control which sections a user signs up for
// notifications.
export default class NotifCheckBox extends React.Component {
  // the only thing required for you to pass in is what section this NotifCheckBox
  // was rendered in. We can get all the other data from that.
  static propTypes = {
    section: PropTypes.object.isRequired,
  }

  // creates a new Notification Check Box that has the section's
  // hash in section, and sets checked to be the initial value of if the section
  // is currently in the user or not
  constructor(props) {
    super(props);

    this.state = {
      // has a user already signed up for notifications on a section?
      checked: user.hasSectionAlready(Keys.getSectionHash(this.props.section)),

      // the section for a class that this NotifCheckBox is for
      section: this.props.section,
    };


    this.doChange = this.doChange.bind(this);
  }

    async componentDidMount() {


	  

    }

  // if the state is currently checked, uncheck, remove the section from the user's data
  // do opposite.
  // send data to backend
    async doChange() {
	if (!user.user) {
	    await user.downloadUserData();
	}
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


    // one last check to ensure the state is correct... since sometimes the user isn't
    // in place by the time rendering has started.
    if (this.state.checked !== user.hasSectionAlready(Keys.getSectionHash(this.state.section))) {
      this.state.checked = !this.state.checked;
    }

    // if we have a section, and the section has seats remaining, it doesn't make
    // sense to sig up a user for notifications, so make the Checkbox readonly
    if (this.state.section && this.state.section.seatsRemaining) {
	return <Icon size='large' name='info circle' color='grey'/>;
    }

    // otherwise, return a checkbox that has the correct state
    return <Checkbox toggle checked={ this.state.checked } onChange={ this.doChange } />;
  }
}
