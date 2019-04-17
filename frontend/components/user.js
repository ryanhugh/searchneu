/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import randomstring from 'randomstring';

import request from './request';
import macros from './macros';


// Manages user data in the frontend
// Downloads the data from the server when the page first starts

// Eventually, this can be used to get the current user data from the server.

class User {
  constructor() {
    // Promise to keep track of user data.
    this.userDataPromise = null;

    this.downloadUserData();
  }

  // Downloads the user data from the server.
  // Send the loginKey and the facebookMessengerId (if we have it).
  // Save the facebookMessengerId when the server responds (the server can respond to this request a lot faster when given the facebookMessengerId).
  async downloadUserData() {
    // User has not logged in before, don't bother making the request
    if (!this.hasLoggedInBefore()) {
      return;
    }


    const body = {
      loginKey: this.getLoginKey(),
    };

    // If we have sender id, send that up too
    // (will make the server respond faster)
    if (window.localStorage.senderId) {
      body.senderId = window.localStorage.senderId;
    }


    const response = await request.post({
      url: '/getUserData',
      body: body,
    });

    // If error, delete local invalid data.
    if (response.error) {
      macros.log('Data in localStorage is invalid, deleting');
      delete window.localStorage.senderId;
      delete window.localStorage.loginKey;
      return;
    }

    this.user = response.user;

    // Keep track of the sender id too.
    window.localStorage.senderId = response.user.facebookMessengerId;

    macros.log('got user data');
  }

  // Revokes the loginKey
  revokeLoginKey() {
    delete window.localStorage.loginkey;
  }

  // Return if the user has logged in before.
  // This doesn't mean they are currently logged in, it just means they might be logged in.
  // and we need to hit the server and check.
  hasLoggedInBefore() {
    return !!window.localStorage.loginKey;
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
}


export default new User();
