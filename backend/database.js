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
      macros.log('====================================================');
      macros.log("Don't have firebase config, probably going to crash.");
      macros.log('====================================================');
      return null;
    }

    firebase.initializeApp({
      credential: firebase.credential.cert(firebaseConfig),
      databaseURL: 'https://search-neu.firebaseio.com/',
    });

    // Firebase keeps an open connection to Google's servers
    // Which will keep this Node.js process awake
    // To cancel this connection (and let the app terminate automatically) run app.delete();
    // App is the return value of firebase.initializeApp

    return firebase.database();
  }

  // Firebase uses a recursive object to keep track of keys and values
  // each object can either be a path to more objects or a leaf node
  // only the leaf nodes hold values
  setMemoryStorage(keySplit, value, currObject = this.memoryStorage) {
    if (keySplit.length === 0) {
      macros.error('setMemoryStorage called with invalid 0 length key', value);
      return;
    }

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

  // Helper funciton for getMemoryStorage. When this function is given a node, it will recursivly return a list of all of the
  // values on leaf nodes that are children of this node.
  // For instance, if this function is given a node that has two children that are both leaves,
  // it will return the values on both of these children.
  // This is how Firebase works too.
  getChildren(node) {
    if (node.type !== 'node') {
      macros.error('getChildren was node called with a node!', node);
      return [];
    }

    let output = [];

    for (const childNode of Object.values(node.children)) {
      if (childNode.type === 'node') {
        output = output.concat(this.getChildren(childNode));
      } else if (childNode.type === 'leaf') {
        output.push(childNode.value);
      }
    }

    return output;
  }

  // Gets a value from the in-memory storage.
  // keySplit is the output of standarizeKey function
  // The setting and getting works the same way that firebase's getting and setting works.
  // Will recursively call into itself for each path in the given path
  // to find the value.
  getMemoryStorage(keySplit, currObject = this.memoryStorage) {
    if (keySplit.length === 0) {
      macros.error('getMemoryStorage called with invalid 0 length key');
      return null;
    }

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

  // Standardizes a key the same way that Firebase standardizes keys
  // Just for use by getMemoryStorage and setMemoryStorage
  standardizeKey(key) {
    if (key.startsWith('/')) {
      key = key.slice(1);
    }

    if (key.endsWith('/')) {
      key = key.slice(0, key.length - 1);
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
    return null;
  }

  // Get the value at this key.
  // Key follows the same form in the set method
  async get(key) {
    if (macros.PROD) {
      const db = await this.dbPromise;
      const value = await db.ref(key).once('value');
      return value.val();
    }

    return this.getMemoryStorage(this.standardizeKey(key));
  }

  // Returns the raw firebase ref for a key
  // Use this if you need to read a value, check something about it, and then write to it.
  async getRef(key) {
    if (macros.PROD) {
      const db = await this.dbPromise;
      return db.ref(key);
    }

    return new MockFirebaseRef(this, this.standardizeKey(key));
  }
}


export default new Database();
