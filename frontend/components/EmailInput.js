/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import { Input } from 'semantic-ui-react';
import PropTypes from 'prop-types';

import macros from './macros';
import request from './request';

const SUBMIT_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  HIDDEN: 'hidden',
};


// Home page component
class EmaillInput extends React.Component {
  static propTypes = {
    containerStyle: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      emailSubmitStatus: SUBMIT_STATUS.HIDDEN,
    };


    // We have to use a ref because when browsers
    // autofill the input, they don't populate the value of <input>.value until the user takes another action on the page
    // which is super weird, but whatever
    // so we have to grab the <input>.value the next time the user makes an action
    // https://github.com/facebook/react/issues/1159
    this.inputRef = React.createRef();

    this.onEmailChange = this.onEmailChange.bind(this);
    this.onEmailSubmitButton = this.onEmailSubmitButton.bind(this);
  }

  onEmailSubmitButton() {
    const email = this.inputRef.current.inputRef.value;

    this.submitEmail(email);
  }

  onEmailChange(event) {
    const email = event.target.value || this.inputRef.current.inputRef.values;

    if (event.key === 'Enter') {
      this.submitEmail(email);
    } else {
      macros.log('updatinging email', event.target.value);
    }
  }

  async submitEmail(email) {
    if (macros.occurrences(email, '@', true) !== 1) {
      macros.log('not submitting invalid email');
    }

    macros.log('submitting email', email);
    macros.logAmplitudeEvent('Frontend Email Submit', { email: email });

    let response;
    try {
      response = await request.post({
        url:'/subscribeEmail',
        body: {
          email: email,
        },
      });
    } catch (e) {
      response = { error:true };
    }

    if (response.error) {
      this.setState({
        emailSubmitStatus: SUBMIT_STATUS.ERROR,
      });
    } else {
      this.setState({
        emailSubmitStatus: SUBMIT_STATUS.SUCCESS,
      });

      // Clear the input
      this.inputRef.current.inputRef.value = '';

      // Hide the message after 2 seconds
      setTimeout(() => {
        this.setState({
          emailSubmitStatus: SUBMIT_STATUS.HIDDEN,
        });
      }, 2000);
    }
  }


  render() {
    const submitButton = (<button type='submit' className='ui button' onClick={ this.onEmailSubmitButton }>Submit</button>);

    let string = 'Successfully Submitted';
    let statusClassName = 'emailStatus ';
    if (this.state.emailSubmitStatus === SUBMIT_STATUS.SUCCESS) {
      string = 'Successfully Submitted';
      statusClassName += 'success';
    } else if (this.state.emailSubmitStatus === SUBMIT_STATUS.ERROR) {
      string = 'Error submitting email.';
      statusClassName += 'error';
    }

    return (
      <div style={ this.props.containerStyle } className='enterEmailContainer atentionContainer'>
        <p className='helpFistRow emailTopString'>
          Want to get updates when new features are released?
        </p>

        <Input ref={ this.inputRef } onKeyDown={ this.onEmailChange } type='email' name='email' className='enterEmail' size='mini' action={ submitButton } placeholder='Enter your email' />
        <div className='statusContainer'>
          <p className={ statusClassName }>
            {string}
          </p>
        </div>
      </div>
    );
  }
}


export default EmaillInput;
