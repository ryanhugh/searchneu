/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import request from './request';
import macros from './macros';
import user from './user';
// import classCache from './classCache';

// This file is a wrapper around Facebook's API.
// Call through this file if you need anything related to FB API
// Currently, it manages initialization, the send_to_messenger callback, and getIsLoggedIn

// It also handles dealing with various types of adblock blocking (and breaking) various parts of of FB's api
// For instance, uBlock origin in Google chrome will allow the initial request to https://connect.facebook.net/en_US/sdk.js (which makes window.FB work),
//     but blocks a subsequent request to https://www.facebook.com/v2.11/plugins/send_to_messenger.php?... which breaks the send to messenger plugin
// Firefox's strict browsing mode blocks the initial request to https://connect.facebook.net/en_US/sdk.js, which makes window.FB never load at all.
// In both of these cases, show the user a popup asking them to disable their adblock for this feature to work.

// This file does not run in tests
// It is possible to require it directly with jest.requireActual, but then the loadFbApi still runs which you would need to make not run.

const MESSENGER_PLUGIN_STATE = {
  UNTESTED: 'Untested',
  FAILED: 'Failed',
  RENDERED: 'Rendered',
};

class Facebook {
  constructor() {
    // The initial request for window.FB is kept track with a promise
    // Add the FB tracking code to the page.
    this.fbPromise = this.loadFbApi();

    // Keeps track of whether the FB api has ever failed to render or successfully rendered since the page has been loaded.
    this.messengerRenderState = MESSENGER_PLUGIN_STATE.UNTESTED;

    // Bind callbacks
    this.onSendToMessengerClick = this.onSendToMessengerClick.bind(this);
  }

  // Loads the FB Api.
  // This is an private method - don't call from outside or else it may load the api twice.
  // Just use this.fbPromise
  loadFbApi() {
    return new Promise((resolve, reject) => {
      // This code was adapted from Facebook's tracking code
      // I added an error handler to know if the request failed (adblock, ff strict browsing mode, etc)
      const id = 'facebook-jssdk';
      const firstJavascript = window.document.getElementsByTagName('script')[0];

      // If it already exists, don't add it again
      if (window.document.getElementById(id)) {
        resolve(window.FB);
        return;
      }

      const js = window.document.createElement('script');
      js.id = id;
      js.src = 'https://connect.facebook.net/en_US/sdk.js';

      js.addEventListener('error', () => {
        // Also change the state of the plugin to failed.
        this.messengerRenderState = MESSENGER_PLUGIN_STATE.FAILED;

        reject();
      });

      firstJavascript.parentNode.insertBefore(js, firstJavascript);

      // If the FB JS loaded succesfully, it will call window.fbAsyncInit
      window.fbAsyncInit = () => {
        window.FB.init({
          appId            : '1979224428978082',
          autoLogAppEvents : false,
          xfbml            : false,
          version          : 'v2.11',
        });


        window.FB.Event.subscribe('send_to_messenger', this.onSendToMessengerClick);

        // And finally, resolve the promise with window.FB
        resolve(window.FB);
      };
    });
  }

  getFBPromise() {
    return this.fbPromise;
  }

  pluginFailedToRender() {
    if (this.messengerRenderState === MESSENGER_PLUGIN_STATE.RENDERED) {
      macros.error("state was rendered but was just told it doesn't work. ");
    }

    this.messengerRenderState = MESSENGER_PLUGIN_STATE.FAILED;
  }


  // Return if the plugin has successfully rendered at least once.
  // This can be used to tell if there any adblock on the page that is blocking the plugin.
  didPluginRender() {
    return this.messengerRenderState === MESSENGER_PLUGIN_STATE.RENDERED;
  }

  didPluginFail() {
    return this.messengerRenderState === MESSENGER_PLUGIN_STATE.FAILED;
  }

  // sets the given callback to "handleClick"
  // handleClickGetter(callback) {
  //   this.handleClick = callback;
  //   // THIS NEEDS TO CHANGE  --- this is called from signupfornotifications.js which has many instances, which when called here will override the others
  // }

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
  async onSendToMessengerClick(e) {
    if (e.event === 'rendered') {
      macros.log('Plugin was rendered');

      if (this.messengerRenderState === MESSENGER_PLUGIN_STATE.FAILED) {
        macros.error('state was failed but it just worked.');
      }

      this.messengerRenderState = MESSENGER_PLUGIN_STATE.RENDERED;
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


      // User is now authenticated with Facebook.
      // Download any potential user data from the backend.
      user.downloadUserData();

      const userData = JSON.parse(atob(e.ref));

      // let aClass = classCache.getClassInstance(user.classHash);

      // console.log("User is adding", aClass);

      // user.addClass(aClass, false)

      macros.logAmplitudeEvent('FB Send to Messenger', {
        message: 'Sign up clicked',
        hash: userData.classHash,
      });

      // In development mode, the fb id of the developer running this code
      // should be injected into this code with webpack
      // if is stored in the config.json. (backend macros.getEnvVariable)
      let fbMessengerId;
      if (process.env.fbMessengerId) {
        fbMessengerId = String(process.env.fbMessengerId);
      } else {
        // These 0's and the 1's below don't mean anything - they are just filler values.
        fbMessengerId = '0000000000000000';
      }

      // When the Send To Messenger button is clicked in development, the webhook is still sent to prod by Facebook
      // In this case, send the data to the development server directly.
      // These 1s don't mean anything - they are just filler values.
      if (macros.DEV) {
        macros.log('Your FB id is:', fbMessengerId, typeof fbMessengerId);

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
                        id: fbMessengerId,
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
