/*
 * This file is part of Search NEU and is licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Checkbox } from 'semantic-ui-react';
import user from '../user';
import macros from '../macros';

// This file renders the checkboxes that control which sections a user signs up for
// notifications.

export default class NotifCheckBox extends Checkbox {

  
  constructor(props) {
    super(props);

    const wantedSection = this.props.section;

    this.state.checked = user.hasSectionAlready(wantedSection);
    this.state.section = wantedSection;

      
  }

  handleChange = (e, { value }) => {

    if (this.state.checked) {
      this.setState({checked: false});
      user.removeSection(this.state.section);
    } else {
      this.setState({checked: true});
      user.enrollSection(this.state.section);
    }

  }

  render() {
    this.setState();
    if (this.props.seats) {
      return <Checkbox toggle readOnly/>
    } else {
      return <Checkbox toggle checked={this.state.checked} onChange = {this.handleChange}/>
    }
  }
  
}
