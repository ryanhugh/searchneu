/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import PropTypes from 'prop-types';
import CSSModules from 'react-css-modules';
import { Button } from 'semantic-ui-react';

import macros from './macros';
import css from './SignUpForNotifications.css';
import authentication from './authentication';
import Keys from '../../common/Keys';

// This file is responsible for the Sign Up for notifications flow.
// First, this will render a button that will say something along the lines of "Get notified when...!"
// Then, if that button is clicked, the Facebook Send To Messenger button will be rendered.
// (This Sent To Messenger button is not rendered initially because it requires that an iframe is added and 10+ http requests are made for each time it is rendered)

// TODO: Lets make it so clicking on the Send To Messenger button changes this to a third state that just says thanks for signing up!

class SignUpForNotifications extends React.Component {
  static propTypes = {
    aClass: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      showMessengerButton: false,
    };


    this.onSubscribeToggleChange = this.onSubscribeToggleChange.bind(this);
  }

  // After the button is added to the DOM, we need to tell FB's SDK that it was added to the code and should be processed.
  // This will tell FB's SDK to scan all the child elements of this.facebookScopeRef to look for fb-send-to-messenger buttons.
  componentDidUpdate() {
    if (this.facebookScopeRef) {
      window.FB.XFBML.parse(this.facebookScopeRef);
    }
  }

  // Updates the state to show the button.
  onSubscribeToggleChange() {
    this.setState({
      showMessengerButton: true,
    });
  }

  // Return the FB button itself.
  getSendToMessengerButton() {
    const loginKey = authentication.getLoginKey();

    const aClass = this.props.aClass;

    // Get a list of all the sections that don't have seats remaining
    const sectionsHashes = [];
    for (const section of aClass.sections) {
      if (section.seatsRemaining <= 0) {
        sectionsHashes.push(Keys.create(section).getHash());
      }
    }

    // JSON stringify it and then base64 encode the data that we want to pass to the backend.
    // Many characters arn't allowed to be in the ref attribute, including open and closing braces.
    // So base64 enocode it and then decode it on the server. Without the base64 encoding, the button will not render.
    const dataRef = btoa(JSON.stringify({
      classHash: Keys.create(aClass).getHash(),
      sectionHashes: sectionsHashes,
      dev: macros.DEV,
      loginKey: loginKey,
    }));

    return (
      <div ref={ (ele) => { this.facebookScopeRef = ele; } } className={ css.inlineBlock }>
        <div
          className={ `fb-send-to-messenger ${css.sendToMessengerButton}` }
          messenger_app_id='1979224428978082'
          page_id='807584642748179'
          data-ref={ dataRef }
          color='white'
          size='large'
        />
      </div>
    );
  }

  render() {
    if (window.location.hash !== '#fbtest') {
      return null;
    }

    if (this.state.showMessengerButton) {
      return (
        <div className={ css.facebookButtonContainer }>
          <div className={ css.sendToMessengerButtonLabel }>
            Click this button to continue
          </div>
          {this.getSendToMessengerButton()}
        </div>
      );
    } else if (this.props.aClass.sections.length === 0) {
      return <Button basic onClick={ this.onSubscribeToggleChange } content='Get notified when sections are added!' className={ css.notificationButton } />;
    } else if (this.props.aClass.isAtLeastOneSectionFull()) {
      return <Button basic onClick={ this.onSubscribeToggleChange } content='Get notified when seats open up!' className={ css.notificationButton } />;
    }
    return null;
  }
}

export default CSSModules(SignUpForNotifications, css);
