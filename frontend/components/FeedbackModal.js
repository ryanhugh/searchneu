import React from 'react';
import CSSModules from 'react-css-modules';
import { Dropdown, Button, Icon, Modal, Header, TextArea, Input, Form } from 'semantic-ui-react';
import classNames from 'classnames/bind';

import request from './request';
import css from './FeedbackModal.css';

const cx = classNames.bind(css);

class FeedbackModal {
  
  // The bool of whether the feedback form should be open or not
  // needs to be tracked in home.js
  // because it is set to true when clicking the buttons to open this Modal in Home.js
  // and is set to false through actions in this component.
  static propTypes = {
    closeForm: PropTypes.func.isRequired,
    feedbackModalOpen: PropTypes.bool.isRequired
  };

  
  constructor() {
    
  }
  
  
  onSubmit = () => {
    
  }
  
  
  render() {
    
    
    return (
        <Modal open={ this.props.feedbackModalOpen } onClose={ this.props.closeForm } size='small'>
          <Header icon='mail' content='Search NEU Feedback' />
          <Modal.Content className={ css.formModalContent }>
            <Form id='feedbackForm' action='https://formspree.io/ryanhughes624@gmail.com' method='POST'>
              <div className={ css.feedbackParagraph }>Find a bug in Search NEU? Find a query that dosen&apos;t come up with the results you were looking for? Have an idea for an improvement or just want to say hi? Drop a line below! Feel free to write whatever you want to and someone on the team will read it.</div>
              <TextArea name='response' form='feedbackForm' className={ css.feedbackTextbox } />
              <p>By default this form is anonymous. Leave your name and/or email if you want us to be able to contact you.</p>
              <Input name='contact' form='feedbackForm' className={ css.formModalInput } />
            </Form>
          </Modal.Content>
          <Modal.Actions>
            <Button basic color='red' onClick={ this.props.closeForm }>
              <Icon name='remove' />
              Cancel
            </Button>
            <Button type='submit' value='Send' color='green' form='feedbackForm'>
              <Icon name='checkmark' />
              Submit
            </Button>
          </Modal.Actions>
        </Modal>
      )
    
  }
  
  
}

// backup = window.location.pathname
// window.history.replaceState(null, null, '/');


// xmlhttp2 = new XMLHttpRequest();
// xmlhttp2.onreadystatechange = function onreadystatechange() {
//         if (xmlhttp2.readyState !== 4) {
//           return;
//         }
//     console.log(xmlhttp2.response)
//     window.history.replaceState(null, null, backup);
// }


// xmlhttp2.open('POST', 'https://formspree.io/ryanhughes624@gmail.com', true);

// // xmlhttp2.setRequestHeader('Referrer', 'https://localhost:5000')
// xmlhttp2.setRequestHeader('Content-Type', 'application/json')

// xmlhttp2.send(JSON.stringify({a:5}))




export default new FeedbackModal;