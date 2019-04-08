/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import randomstring from 'randomstring';

// Manages user data in the frontend
// Downloads the data from the server when the page first starts

// Eventually, this can be used to get the current user data from the server.

class User {
  constructor() {
    this.downloadUserData();
  }

  // Downloads the user data from the server.
  // Send the loginKey and the facebookMessengerId (if we have it).
  // Save the facebookMessengerId when the server responds (the server can respond to this request a lot faster when given the facebookMessengerId).
  downloadUserData() {

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
