/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Transition } from 'react-transition-group';

import {
  Button,
  Icon,
  Modal,
  Header,
  TextArea,
  Input,
  Form,
  Message,
} from 'semantic-ui-react';

import macros from './macros';
import request from './request';

// This file manages the two popups that asks for user information
// 1. the feedback popup that shows up if you click the feedback button on the bottom of the page
// 2. At one point, instead of the typeform, we had a similar popup appear asking if user's were interested
// These popups display a messge and have a a text box for users to enter data, and then they sent this data to the backend

class FeedbackModal extends React.Component {
  // The bool of whether the feedback form should be open or not
  // needs to be tracked in home.js
  // because it is set to true when clicking the buttons to open this Modal in Home.js
  // and is set to false through actions in this component.
  static propTypes = {
    toggleForm: PropTypes.func.isRequired,
    feedbackModalOpen: PropTypes.bool.isRequired,
    isFeedback: PropTypes.bool,
    isHelpOut: PropTypes.bool,
  };

  static defaultProps = {
    isFeedback: false,
    isHelpOut: false,
  };

  constructor(props) {
    super(props);

    this.state = {

      // The value of the message box.
      messageValue: '',

      // The value of the contact box.
      contactValue: '',

      // Whether the message is visible or not.
      messageVisible: false,
    };

    if (!props.isHelpOut && !props.isFeedback) {
      macros.error('popup has to either be ishelp out or isFeedback');
    }

    this.onTextAreaChange = this.onTextAreaChange.bind(this);
    this.onContactChange = this.onContactChange.bind(this);
    this.hideMessage = this.hideMessage.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }


  async onSubmit() {
    // Send an event to amplitude too, just for redundancy.
    macros.logAmplitudeEvent('Feedback', { text: this.state.messageValue, contact: this.state.contactValue });

    const response = await request.post({
      url: '/submitFeedback',
      body: {
        message: this.state.messageValue,
        contact: this.state.contactValue,
      },
    });

    if (response.error) {
      macros.error('Unable to submit feedback', response.error, this.state.messageValue, this.state.contactValue);
    }

    this.setState({
      messageVisible: true,
      messageValue: '',
      contactValue: '',
    });

    // Hide the message after 2 seconds
    setTimeout(() => {
      this.setState({
        messageVisible: false,
      });
    }, 2000);

    this.props.toggleForm();
  }

  onTextAreaChange(event) {
    this.setState({
      messageValue: event.target.value,
    });
  }

  onContactChange(event) {
    this.setState({
      contactValue: event.target.value,
    });
  }

  hideMessage() {
    this.setState({
      messageVisible: false,
    });
  }

  render() {
    const transitionStyles = {
      entering: { opacity: 0 },
      entered: { opacity: 1 },
      exited: { display: 'none', opacity: 0 },
    };

    let firstText;
    let secondBody;
    let header = null;

    if (this.props.isFeedback) {
      firstText = 'Find a bug in Search NEU? Find a query that doesn\'t come up with the results you were looking for? Have an idea for an improvement or just want to say hi? Drop a line below! Feel free to write whatever you want to and someone on the team will read it.';
      secondBody = [
        <p key='0'>
          By default this form is anonymous. Leave your name and/or email if you want us to be able to contact you.
        </p>,
        <Input name='contact' form='feedbackForm' className='formModalInput' onChange={ this.onContactChange } key='1' />,
      ];

      header = 'Search NEU Feedback';
    } else {
      header = 'Get Involved with Search NEU!';
      firstText = 'Thanks for your interest! We\'d love to have more people help out with the project. We are looking for people for both introductory level roles and leadership roles. There\'s a lot of CS stuff (new features, etc) and non-CS stuff (posters, marketing, outreach, etc) that we could work on, so it is no problem at all if you don\'t have a lot of experience in CS! Everything is flexible, and we could help you learn some programming along the way if you want to work on the site 🙂. Leave your name and some way we can get in contact (Facebook URL, email, Fortnite username, etc) and someone will reach out!';
    }

    return (
      <div className='feedback-container'>
        <Transition in={ this.state.messageVisible } timeout={ 500 }>
          {(state) => {
            return (
              <Message
                success
                className='alertMessage'
                header='Your submission was successful.'
                style={{ ...transitionStyles[state] }}
                onDismiss={ this.hideMessage }
              />
            );
          }}
        </Transition>
        <Modal open={ this.props.feedbackModalOpen } onClose={ this.props.toggleForm } size='small' className='feedback-modal-container'>
          <Header icon='mail' content={ header } />
          <Modal.Content className='formModalContent'>
            <Form>
              <div className='feedbackParagraph'>
                {firstText}
              </div>
              <TextArea name='response' form='feedbackForm' className='feedbackTextbox' onChange={ this.onTextAreaChange } />
              {secondBody}
            </Form>
          </Modal.Content>
          <Modal.Actions>
            <Button basic color='red' onClick={ this.props.toggleForm }>
              <Icon name='remove' />
              Cancel
            </Button>
            <Button type='submit' color='green' form='feedbackForm' onClick={ this.onSubmit }>
              <Icon name='checkmark' />
              Submit
            </Button>
          </Modal.Actions>
        </Modal>
      </div>
    );
  }
}

export default FeedbackModal;
