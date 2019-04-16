/*
 * This file is part of Search NEU and is licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Checkbox } from 'semantic-ui-react';

// This file renders the checkboxes that control which sections a user signs up for
// notifications.

export default class NotifCheckBox extends Checkbox {

  
  constructor(props) {
    super(props);
  }

  handleChange = (e, { value }) => {
  }

  render() {
    if (this.props.seats) {
      return <Checkbox toggle readOnly/>
    } else {
      return <Checkbox toggle/>
    }
  }
  
}
