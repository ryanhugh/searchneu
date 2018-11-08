/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import ReactTooltip from 'react-tooltip';
import cx from 'classnames/bind';
import { Dropdown, Input } from 'semantic-ui-react';

import macros from './macros';
import request from './request';


// Home page component
class EmaillInput extends React.Component {
  constructor(props) {
    super(props);

    this.state = {

      // Value of the email text box when people are entering their email
      userEmail: '',



    }


    this.onEmailChange = this.onEmailChange.bind(this);
    this.onEmailSubmitButton = this.onEmailSubmitButton.bind(this);


	}


  submitEmail(email) {

    if (macros.occurrences(email, '@', true) != 1) {
      macros.log('not submitting invalid email');

    }

    console.log('submitting email', email)


    request.post({
      url:'/subscribeEmail', 
      body: {
        email: email
      }})
  }

  onEmailSubmitButton() {
    this.submitEmail(this.state.userEmail);
  }

  onEmailChange(event) {
    if (event.key == 'Enter') {
      this.submitEmail(event.target.value);
    } 
    else {
      console.log('updatinging email', event.target.value)
      this.setState({
        userEmail: event.target.value
      })
    }
  }




	render() {
    let submitButton = (<button className="ui button" onClick={this.onEmailSubmitButton} role="button">Submit</button>)

    return (
      <div style={this.props.actionCenterStyle} className='enterEmailContainer'>
       <p className='helpFistRow emailTopString'>
          Want to get updates when new features are released?
        </p>

        <Input onKeyDown={this.onEmailChange} type="email" name="email" className="enterEmail" size="mini" action={submitButton} placeholder='Enter your email...' />
        <p>

        </p>
      </div>
    )

	}


}


export default EmaillInput;