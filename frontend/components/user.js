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
      this.logOut();
      return;
    }

    this.user = response.user;
    macros.log(this.user);

    // Keep track of the sender id too.
    window.localStorage.senderId = response.user.facebookMessengerId;

    macros.log('got user data');
  }

  // Revokes the loginKey and user user-specific data
  logOut() {
    delete window.localStorage.loginkey;
    delete window.localStorage.senderId;
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

  hasSectionAlready(sectionHash) {
    if (this.user) {
      return this.user.watchingSections.includes(sectionHash);
    }
  }

  // removes a section from a user, as well as the class if no more sections are tracked
  // in that class
  removeSection(sectionHash) {
    if (!this.user) {
      macros.error('no user for removal?');
      return;
    }
    
    if (this.user.watchingSections.includes(sectionHash)) {
      this.user.watchingSections.splice(this.user.watchingSections.indexOf(sectionHash), 1);

      const classHash = sectionHash.substring(0, sectionHash.lastIndexOf('/'));

      let acc = false;
      for (var i = 0; i < this.user.watchingSections.length; i++) {
	acc = acc || this.user.watchingSections[i].includes(classHash);
      }

      if (!acc) {
	this.user.watchingClasses.splice(this.user.watchingClasses.indexOf(classHash), 1);
      }

      macros.log(this.user);
      
    } else {
      macros.error("removed setion that doesn't exist on user?", sectionHash, this.user);
    }
  }

  // enrolls a user in a section of a class
  enrollSection(sectionHash) {
    if (!this.user) {
      macros.error('no user for addition?');
      return;
    }

    if (this.user.watchingSections.includes(sectionHash)) {
      macros.error('user already watching section?', sectionHash, this.user);
    }

    this.user.watchingSections.push(sectionHash);

    let classHash = sectionHash.substring(0, sectionHash.lastIndexOf('/'));
    let acc = false;
    for (var i = 0; i < this.user.watchingSections.length; i++) {
      acc = acc || this.user.watchingSections[i].includes(classHash);
    }

    if (!acc) {
      this.user.watchingClasses.push(classHash);
    }

    macros.log(this.user);
	
  }
}


export default new User();
