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

  componentDidUpdate() {
    if (this.facebookScopeRef) {
      window.FB.XFBML.parse(this.facebookScopeRef);
    }
  }

  onSubscribeToggleChange() {
    this.setState({
      showMessengerButton: true,
    });
  }

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
    let updatesSection = null;
    if (this.state.showMessengerButton) {
      const sendToMessengerButton = this.getSendToMessengerButton();

      updatesSection = (
        <div className={ css.facebookButtonContainer }>
          <div className={ css.sendToMessengerButtonLabel }>
            Click this button to continue
          </div>
          {sendToMessengerButton}
        </div>
      );
    } else if (this.props.aClass.sections.length === 0) {
      updatesSection = <Button basic onClick={ this.onSubscribeToggleChange } content='Get notified when sections are added!' className={ css.notificationButton } />;
    } else if (this.props.aClass.isAtLeastOneSectionFull()) {
      updatesSection = <Button basic onClick={ this.onSubscribeToggleChange } content='Get notified when seats open up!' className={ css.notificationButton } />;
    }

    // Disable the button under a flag - just for now
    if (window.location.hash !== '#fbtest') {
      updatesSection = null;
    }

    return updatesSection;
  }
}

export default CSSModules(SignUpForNotifications, css);
