/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import randomstring from 'randomstring';

import _ from 'lodash';
import request from './request';
import macros from './macros';
import Keys from '../../common/Keys';


// Manages user data in the frontend
// Downloads the data from the server when the page first starts

class User {
  constructor() {
    // Keep track of the user object.
    this.user = null;

    // Promise to keep track of user data downloading status.
    this.userDataPromise = null;

    // Download the user data as soon as the page loads
    this.downloadUserData();

    // Allow other classes to listen to changes in the user object.
    // Any time the user object is called, these handlers are called.
    this.userStateChangedHandlers = [];
  }

  // Register a handler for user updates.
  registerUserChangeHandler(handler) {
    this.userStateChangedHandlers.push(handler);
  }

  // Unregister a handler for user updates.
  unregisterUserChangeHandler(handler) {
    _.pull(this.userStateChangedHandlers, handler);
  }

  // Calls all the userStateChangedHandlers.
  // Internal only.
  callUserChangeHandlers() {
    for (const handler of this.userStateChangedHandlers) {
      handler(this.user);
    }
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

    macros.log('data going to the backend is', body);

    // Keep track of the status of this call, so future calls that
    // modify the user and update the backend
    // can wait for this to finish before running.
    this.userDataPromise = request.post({
      url: '/getUserData',
      body: body,
    }).then((response) => {
      // If error, delete local invalid data.
      if (response.error) {
        macros.log('Data in localStorage is invalid, deleting');
        this.logOut();
        return;
      }

      this.user = response.user;

      // Keep track of the sender id too.
      window.localStorage.senderId = response.user.facebookMessengerId;

      this.callUserChangeHandlers();

      macros.log('got user data', this.user);
    });
  }

  // String -> Object
  // Sets up a body to send data to the backend
  setupSendingData(data) { // RENAME
    // User has not logged in before, don't bother making the request
    // if (!this.hasLoggedInBefore()) {
    //   return null;
    // }

    // macros.log('sending.... ', this.user);
    // if (!this.user) {
    //   await this.downloadUserData(); // DONT CALL THIS HERE!!
    // }

    // Wait for the user state to settle before running.
    // await this.userDataPromise;

    // If after settling, the user is invalid, exit early
    // if (!this.user || !this.hasLoggedInBefore()) {
    //   return null;
    // }

    const body = {
      loginKey: this.getLoginKey(),
      info: data,
      classId: data.classId,
      subject: data.subject,
    };

    // If we have sender id, send that up too
    // (will make the server respond faster)
    if (window.localStorage.senderId) {
      body.senderId = window.localStorage.senderId;
    }

    if (data.crn) {
      body.crn = data.crn
    }

    return body;
  }

  // Revokes the loginKey and user user-specific data
  logOut() {
    // Clear the authentication tokens and user id.
    // These will be regenerated when the user signs back in.
    delete window.localStorage.loginKey;
    delete window.localStorage.senderId;

    // Also clear the local user data.
    // If the user signs in again, this user info will be restored.
    this.user = null;

    this.callUserChangeHandlers();
  }

  // Return if the user has logged in before.
  // This doesn't mean they are currently logged in, it just means they might be logged in.
  // and we need to hit the server and check.
  hasLoggedInBefore() {
    return !!window.localStorage.loginKey;
  }

  // gets a user's (as in browser) loginKey, or generates one if it doesn't exist yet
  getLoginKey() {
    let loginKey = window.localStorage.loginKey;

    // Init the loginKey if it dosen't exist
    if (!loginKey) {
      loginKey = randomstring.generate(100);
      window.localStorage.loginKey = loginKey;
    }

    return loginKey;
  }

  // checks if the user already has the section in it
  hasSectionAlready(sectionHash) {
    if (this.user) {
      return this.user.watchingSections.includes(sectionHash);
    }
    return false;
  }

  // checks if the user already has the class in it
  hasClassAlready(classHash) {
    if (this.user) {
      return this.user.watchingClasses.includes(classHash);
    }
    return false;
  }

  // removes a section from a user, as well as the class if no more sections are tracked
  // in that class
  async removeSection(section) {
    // Make sure the user state is settled.
    await this.userDataPromise;

    if (!this.user || !this.hasLoggedInBefore()) {
      macros.error('Remove section called with no valid user.', this.user, this.hasLoggedInBefore());
      return;
    }

    const sectionHash = Keys.getSectionHash(section);

    if (!this.user.watchingSections.includes(sectionHash)) {
      macros.error("removed section that doesn't exist on user?", section, this.user);
      return;
    }

    _.pull(this.user.watchingSections, sectionHash);


    // TOFIX! if you unbusbscribe from the last section, unsub from the class too?


    // const classInfo = {
    //   host: section.host,
    //   termId: section.termId,
    //   subject: section.subject,
    //   classId: section.classId,
    // };
    // const classHash = Keys.getClassHash(classInfo);


    // let acc = false;
    // for (let i = 0; i < this.user.watchingSections.length; i++) {
    //   acc = acc || this.user.watchingSections[i].includes(classHash);
    // }

    // if (!acc) {
    //   _.pull(this.user.watchingClasses, classHash);
    // }

    const body = this.setupSendingData(sectionHash); // FIX!! we need to wait for the initial user data to finish downloading before running these calls. this needs to run before the !user.user in this function
    // body.classHash = classHash;
    // body.sectionInfo = section; // FIX!! the only thing we should be sending to the server is the key. no more.
    // body.classInfo = classInfo;

    await request.post({
      url: '/removeSection',
      body: body,
    });


    this.callUserChangeHandlers();
  }

  // enrolls a user in a section of a class
  // enable updateBackend to update the backend along with updating the state here.
  // this is used when another piece of code updates the backend some way, and we don't want to send two requests to the backend here.
  async enrollSection(section, updateBackend = true) {
    // Make sure the user state is settled.
    await this.userDataPromise;

    if (!this.user || !this.hasLoggedInBefore()) {
      macros.error('Add section called with no valid user.', this.user, this.hasLoggedInBefore());
      return;
    }

    const sectionHash = Keys.getSectionHash(section);

    if (this.user.watchingSections.includes(sectionHash)) {
      macros.error('user already watching section?', section, this.user);
      return;
    }

    this.user.watchingSections.push(sectionHash);

    const classHash = Keys.getClassHash(section);

    const body = {
      loginKey: this.getLoginKey(),
      senderId: window.localStorage.senderId,
      sectionHash: sectionHash,
      classId: section.classId,
      subject: section.subject,
      crn: section.crn
    };

    // TODO: think this through. Best way to keep track of adding/removing sections affecting class sub?
    if (!this.user.watchingClasses.includes(classHash)) {
      this.addClass(section);
    }

    macros.log('Adding section to user', this.user, sectionHash, body);

    await request.post({
      url: '/addSection',
      body: body,
    });

    this.callUserChangeHandlers();
  }

  // adds a class to a user
  // enable updateBackend to update the backend along with updating the state here.
  // this is used when another piece of code updates the backend some way, and we don't want to send two requests to the backend here.
  async addClass(classHash, updateBackend = true) {
    // Make sure the user state is settled.
    await this.userDataPromise;

    if (!this.user || !this.hasLoggedInBefore()) {
      macros.error('Add class called with no valid user.', this.user, this.hasLoggedInBefore());
      return;
    }

    let classHash = Keys.getClassHash(theClass)

    if (this.user.watchingClasses.includes(classHash)) {
      macros.error('user already watching class?', classHash, this.user);
      return;
    }

    this.user.watchingClasses.push(classHash);

    if (updateBackend) {
      const body = this.setupSendingData(classHash);

      const body = {
        loginKey: this.getLoginKey(),
        senderId: window.localStorage.senderId,
        classHash: classHash,
        classId: aClass.classId,
        subject: aClass.subject,
        crn: aClass.crn
      };

      // body.info = classHash;

      await request.post({
        url:'/addClass',
        body: body,
      });
    }

    // TODO: call the event handlers here.
    // When facebook.js calls this with updateBackend = false,
    // the base class panel will be listening and will use this update to display the toggles.
    this.callUserChangeHandlers();

    macros.log('class registered', this.user);
  }
}


export default new User();
