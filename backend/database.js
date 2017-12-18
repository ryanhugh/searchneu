/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import firebase from 'firebase-admin';
import macros from './macros';
import MockFirebaseRef from './MockFirebaseRef';


// In development and testing, a local, in-memory storage is used.
// In production, the data is persisted in firebase.
// This makes testing easier, avoids using production quota in development,
// and allows many people to test this class functionality (and other features that depend on it, such as notifyer.js) without the firebase access tokens.
// It also keeps the ability to run the development server offline.
class Database {
  constructor() {
    if (macros.PROD) {
      // Promise for loading the firebase DB
      this.dbPromise = this.loadDatabase();
    } else {
      // In memory storage
      this.memoryStorage = {};
    }
  }

  async loadDatabase() {
    const firebaseConfig = await macros.getEnvVariable('firebaseConfig');
    if (!firebaseConfig) {
      macros.log("Don't have firebase config, probably going to crash.");
      return null;
    }

    const app = firebase.initializeApp({
      credential: firebase.credential.cert(firebaseConfig),
      databaseURL: 'https://search-neu.firebaseio.com/',
    });

    // Firebase keeps an open connection to Google's servers
    // Which will keep this Node.js process awake
    // To cancel this connection (and let the app terminate automatically) run app.delete();

    return firebase.database();
  }

  // Firebase uses a recursive object to keep track of keys and values
  // each object can either be a path to more objects or a leaf node
  // only the leaf nodes hold values
  setMemoryStorage(keySplit, value, currObject = this.memoryStorage) {
    const currKey = keySplit[0];
    if (keySplit.length === 1) {
      currObject[currKey] = {
        type: 'leaf',
        value: value,
      };
    } else {
      if (currObject[currKey] && currObject[currKey].type === 'leaf') {
        macros.warn('Overriding leaf with node', keySplit, value);
      }

      if (!currObject[currKey] || currObject[currKey].type === 'leaf') {
        currObject[currKey] = {
          type: 'node',
          children: {},
        };
      }

      this.setMemoryStorage(keySplit.slice(1), value, currObject[currKey].children);
    }
  }

  getChildren(node) {
    let output = [];

    for (const node of Object.values(node.children)) {
      if (node.type === 'node') {
        output = output.concat(this.getChildren(node));
      } else if (node.type === 'leaf') {
        output.push(node.value);
      }
    }

    return output;
  }

  getMemoryStorage(keySplit, currObject = this.memoryStorage) {
    const currKey = keySplit[0];

    if (!currObject[currKey]) {
      return null;
    }

    if (keySplit.length === 1) {
      if (currObject[currKey].type === 'leaf') {
        return currObject[currKey].value;
      } else if (currObject[currKey].type === 'node') {
        // Return all of the leafs that are children of this node

        return this.getChildren(currObject[currKey]);
      }

      macros.error('Unknown type', currObject[currKey].type, keySplit, currObject);
      return null;
    }

    return this.getMemoryStorage(keySplit.slice(1), currObject[currKey].children);
  }

  standardizeKey(key) {
    if (key.startsWith('/')) {
      key = key.slice(1);
    }

    if (key.endsWith('/')) {
      key = key.slice(0, key.lenght - 1);
    }

    return key.split('/');
  }

  // Key should follow this form:
  // for users: /users/<user-id> (eg "/users/00000000000")
  // Value can be any JS object.
  // If it has sub-objects you can easily dive into them in the Firebase console.
  async set(key, value) {
    if (macros.PROD) {
      const db = await this.dbPromise;
      return db.ref(key).set(value);
    }

    this.setMemoryStorage(this.standardizeKey(key), value);
  }

  // Get the value at this key.
  // Key follows the same form in the set method
  async get(key) {
    if (macros.PROD) {
      const db = await this.dbPromise;
      const value = await db.ref(key).once('value');
      return value.val();
    }

    this.getMemoryStorage(this.standardizeKey(key));
  }

  // Returns the raw firebase ref for a key
  // Use this if you need to read a value, check something about it, and then write to it.
  async getRef(key) {
    const db = await this.dbPromise;
    return db.ref(key);
  }
}


export default new Database();
