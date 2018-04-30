/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import randomstring from 'randomstring';

import request from './request';
import macros from './macros';

// TODO: add check to see if the user is logged in or not:
// https://developers.facebook.com/docs/reference/javascript
// https://developers.facebook.com/docs/reference/javascript/FB.getLoginStatus

// Eventually, this can be used to get the current user data from the server.

class Authentication {
  constructor() {
    // If the FB library has already loaded, call the init function.
    if (window.FB) {
      this.initFB();
    } else {
      // If the FB library has not loaded, put a function on the global state that the FB library will call when it loads
      window.fbAsyncInit = this.initFB.bind(this);
    }

    this.onSendToMessengerClick = this.onSendToMessengerClick.bind(this);
  }


  initFB() {
    window.FB.init({
      appId            : '1979224428978082',
      autoLogAppEvents : false,
      xfbml            : false,
      version          : 'v2.11',
    });


    window.FB.Event.subscribe('send_to_messenger', this.onSendToMessengerClick);
  }

  getLoginKey() {
    let loginKey = window.localStorage.loginKey;

    // Init the loginKey if it dosen't exist
    if (!loginKey) {
      loginKey = randomstring.generate(100);
      window.localStorage.loginKey = loginKey;
    }

    return loginKey;
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

  onSendToMessengerClick(e) {
    if (e.event === 'rendered') {
      macros.log('Plugin was rendered');
    } else if (e.event === 'checkbox') {
      const checkboxState = e.state;
      macros.log(`Checkbox state: ${checkboxState}`);
    } else if (e.event === 'not_you') {
      macros.log("User clicked 'not you'");
    } else if (e.event === 'hidden') {
      macros.log('Plugin was hidden');
    } else if (e.event === 'opt_in') {
      macros.log('Opt in was clicked!', e);


      macros.logAmplitudeEvent('FB Send to Messenger', {
        message: 'Sign up clicked',
        hash: JSON.parse(atob(e.ref)).classHash,
      });


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
                        id: '1397905100304615',
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


export default new Authentication();
