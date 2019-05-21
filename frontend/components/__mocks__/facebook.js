/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

// import request from './request';
import macros from '../macros';
// import user from './user';

// This file mocks out facebook.js
// Provides stubs for all the methods.


// // in DEV and PROD, we want to load the FB library and attach error handelers and success handelers to the script
// // so we can run code if it fails to load, or works
// // In TEST, we want to run the code as if this request had failed.
// // (code that runs when the request passes depends on FB's API, which will not be available in testing)


class MockFacebook {
  // quick resolve to null
  getFBPromise() {
    return Promise.resolve(null);
  }

  pluginFailedToRender() {
    macros.error('pluginFailedToRender called in testing?');
  }

  // Nope, it didn't work in testing
  didPluginRender() {
    return false;
  }

  // Nope, still doesn't work in testing
  didPluginFail() {
    return true;
  }

  handleClickGetter() {
  }


  getIsLoggedIn() {
    return Promise.resolve(false);
  }
}


export default new MockFacebook();
