/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import firebase from 'firebase-admin';
import macros from './macros';

class Database {

  constructor() {

    this.dbPromise = this.loadDatabase()
  }

  async loadDatabase() {

    let firebaseConfig = await macros.getEnvVariable('firebaseConfig')

    let app = firebase.initializeApp({
      credential: firebase.credential.cert(firebaseConfig),
      databaseURL: 'https://search-neu.firebaseio.com/'
    });

    // Firebase keeps an open connection to Google's servers
    // Which will keep this Node.js process awake
    // To cancel this connection (and let the app terminate automatically) run app.delete();

    return firebase.database()
  }

  // Key should follow this form:
  // for users: /users/<user-id> (eg "/users/00000000000")
  // Value can be any JS object.
  // If it has sub-objects you can easily dive into them in the Firebase console.
  async set(key, value) {
    let db = await this.dbPromise;
    return db.ref(key).set(value);

  }

  // Get the value at this key.
  // Key follows the same form in the set method
  async get(key) {
    let db = await this.dbPromise;
    let value = await db.ref(key).once('value');
    return value.val();
  }

  // Returns the raw firebase ref for a key
  // Use this if you need to read a value, check something about it, and then write to it. 
  async getRef(key) {
    let db = await this.dbPromise;
    return db.ref(key);
  }
}



export default new Database();
