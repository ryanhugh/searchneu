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

const SUBMIT_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  HIDDEN: 'hidden'
}



// Home page component
class EmaillInput extends React.Component {
  constructor(props) {
    super(props);

    this.state = {

      // Value of the email text box when people are entering their email
      userEmail: '',

      // Value of the status string below the text box submittion
      statusString: '',

      emailSubmitStatus: SUBMIT_STATUS.HIDDEN
    }

    this.inputRef = React.createRef();


    this.onEmailChange = this.onEmailChange.bind(this);
    this.onEmailSubmitButton = this.onEmailSubmitButton.bind(this);
	}


  async submitEmail(email) {

    if (macros.occurrences(email, '@', true) != 1) {
      macros.log('not submitting invalid email');

    }

    console.log('submitting email', email)


    let response;
    try {
      response = await request.post({
        url:'/subscribeEmail', 
        body: {
          email: email
      }})
    }
    catch (e) {
      response = {error:true}
    }

    if (response.error) {

      this.setState({
        emailSubmitStatus: SUBMIT_STATUS.ERROR
      })
    }
    else {
      this.setState({
        emailSubmitStatus: SUBMIT_STATUS.SUCCESS
      })

      // Hide the message after 2 seconds
      setTimeout(() => {
        this.setState({
          emailSubmitStatus: SUBMIT_STATUS.HIDDEN
        });
      }, 2000);
    }
  }

  onEmailSubmitButton() {

    let email = this.inputRef.current.inputRef.value

    this.submitEmail(email);
  }

  onEmailChange(event) {
    let email = this.inputRef.current.inputRef.values
    
    if (event.key == 'Enter') {
      this.submitEmail(email);
    } 
    else {
      console.log('updatinging email', event.target.value)
      // this.setState({
      //   userEmail: event.target.value
      // })
    }
  }




	render() {
    let submitButton = (<button className="ui button" onClick={this.onEmailSubmitButton} role="button">Submit</button>)

    let string = 'Successfully Submitted';
    let statusClassName = 'emailStatus '; 
    if (this.state.emailSubmitStatus === SUBMIT_STATUS.SUCCESS) {
      string = "Successfully Submitted";
      statusClassName += 'success'
    }
    else if (this.state.emailSubmitStatus === SUBMIT_STATUS.ERROR) {
      string = 'Error submitting email.';
      statusClassName += 'error'
    }

    return (
      <div style={this.props.actionCenterStyle} className='enterEmailContainer atentionContainer'>
       <p className='helpFistRow emailTopString'>
          Want to get updates when new features are released?
        </p>

        <Input ref={this.inputRef} onKeyDown={this.onEmailChange} type="email" name="email" className="enterEmail" size="mini" action={submitButton} placeholder='Enter your email...' />
        <div className="statusContainer">
          <p className={statusClassName}>
            {string}
          </p>
        </div>
      </div>
    )

	}


}


export default EmaillInput;