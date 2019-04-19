/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import request from './request';
import macros from './macros';
import user from './user';

// This file is a wrapper around Facebook's API.
// Call through this file if you need anything related to FB API
// Currently, it manages initialization, the send_to_messenger callback, and getIsLoggedIn

class Facebook {
  constructor() {
    // If the FB library has already loaded, call the init function.
    if (window.FB) {
      this.initFB();
    } else {
      // If the FB library has not loaded, put a function on the global state that the FB library will call when it loads
      window.fbAsyncInit = this.initFB.bind(this);
    }

    // Keeps track of whether the plugin has rendered succesfully at least once.
    // If it has rendered at least once, the user must not have adblock
    this.successfullyRendered = false;

    this.onSendToMessengerClick = this.onSendToMessengerClick.bind(this);
  }


  initFB() {
    window.FB.init({
      appId            : '1979224428978082',
      autoLogAppEvents : false,
      xfbml            : false,
      version          : 'v2.11',
    });;


    window.FB.Event.subscribe('send_to_messenger', this.onSendToMessengerClick);
  }

  // Return if the plugin has successfully rendered at least once.
  // This can be used to tell if there any adblock on the page that is blocking the plugin.
  didPluginRender() {
    return this.successfullyRendered;
  }

  handleClickGetter(callback) {
    this.handleClick = callback;
  }

  // This function assumes that 'searchneu.com' is whitelisted in the Facebook Developer console settings
  // https://developers.facebook.com/apps/1979224428978082/settings/basic/
  // Facebook only allows applications to run on one domain at a time
  // so this will only work on searchneu.com (and subdomains) and will return true for all other domains (eg http://localhost)
  // You can use localhost.searchneu.com:5000 to bypass this.
  async getIsLoggedIn() {
    if (!window.location.hostname.endsWith('searchneu.com')) {
      return true;
    }

    return new Promise((resolve) => {
      window.FB.getLoginStatus((response) => {
        if (response.status === 'connected') {
          // the user is logged in and has authenticated your
          // app, and response.authResponse supplies
          // the user's ID, a valid access token, a signed
          // request, and the time the access token
          // and signed request each expire
          resolve(true);
        } else if (response.status === 'not_authorized') {
          // the user is logged in to Facebook,
          // but has not authenticated your app
          resolve(true);
        } else {
          // the user isn't logged in to Facebook.
          resolve(false);
        }
      });
    });
  }


  // handles button events
  onSendToMessengerClick(e) {
    if (e.event === 'rendered') {
      macros.log('Plugin was rendered');
      this.successfullyRendered = true;
    } else if (e.event === 'checkbox') {
      const checkboxState = e.state;
      macros.log(`Checkbox state: ${checkboxState}`);
    } else if (e.event === 'not_you') {
      macros.log("User clicked 'not you'");
      user.logOut();
    } else if (e.event === 'hidden') {
      macros.log('Plugin was hidden');
    } else if (e.event === 'opt_in') {
      macros.log('Opt in was clicked!', e);

      user.downloadUserData(100);
      
      macros.logAmplitudeEvent('FB Send to Messenger', {
        message: 'Sign up clicked',
        hash: JSON.parse(atob(e.ref)).classHash,
      });

      this.handleClick();

      // When the Send To Messenger button is clicked in development, the webhook is still sent to prod by Facebook
      // In this case, send the data to the development server directly.
      if (macros.DEV) {
        request.post({
          url: '/webhook',
          body: {
            object: 'page',
            entry: [
              {
                id: '111111111111111',
                time: Date.now(),
                messaging: [
                  {
                    recipient:
                      {
                        id: '111111111111111',
                      },
                    timestamp: Date.now(),
                    sender:
                      {
                        id: '2178896222126069',
                      },
                    optin:
                      {
                        ref: e.ref,
                      },
                  }],
              }],
          },
        });
      } else {
        macros.log(e, 'other message');
      }
      
    }

  }
}


export default new Facebook();
