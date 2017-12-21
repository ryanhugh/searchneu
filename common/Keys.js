/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

// This file is used to manage the {host:, termId: subject:...} objects used to get more data.
// This is used in both the backend and the frontend.
// So anything that is required is is added many different places.
import macros from './commonMacros';


// feature request from server.js: add classId if not given classId and given host+termId+subject
// addclassIds. could also benefit from this feature.

// Copied from lodash source to avoid depending on it here. It wound't be that bad if is needed though.

const endpoints = [];
const minData = 2;

class Keys {
  constructor(obj, endpoint, config) {
    if (obj instanceof Keys || !obj || (!obj.hash && !obj.host) || (obj.isString && !config.stringAllowed)) {
      macros.error('welp', obj);
    }

    if (endpoint) {
      this.endpoint = endpoint;
    }


    // Get string off object if creating with string
    if (obj.desc && obj.host && config.stringAllowed) {
      this.host = obj.host;
      this.desc = obj.desc;
      this.isString = true;

    // Prefer obj over hash
    } else if (obj.host) {
      let endpointIndex;
      if (endpoint) {
        endpointIndex = endpoints.indexOf(endpoint);
      }
      let hasAllKeys = true;
      let i;
      for (i = 0; i < Keys.allKeys.length; i++) {
        const currValue = obj[Keys.allKeys[i]];
        if (!currValue) {
          break;
        } else if (endpointIndex && i > endpointIndex) {
          hasAllKeys = false;
          macros.error(obj, endpoint);
          break;
        } else {
          this[Keys.allKeys[i]] = currValue;
        }
      }

      i++;
      for (; i < Keys.allKeys.length; i++) {
        if (obj[Keys.allKeys[i]]) {
          // Shouldn't have any keys after first one that isn't present
          macros.error(obj, endpoint);
        }
      }

      if (!obj.subject) {
        if (obj.host && obj.termId && obj.hash) {
          if (obj.hash.startsWith('/list') || obj.hash.startsWith('/') || !config.hashAllowed) {
            macros.error(obj);
          } else {
            // this hash shall be "neu.edu/201710/..."
            // A obj hash SHOULD NOT START WITH /LISTsomething
            // the api endpoint is added below
            this.hash = obj.hash;
            hasAllKeys = true;
          }
        }
      }
      if (!hasAllKeys) {
        macros.error('dont have all keys', obj, endpoint);
      }
    } else if (endpoint !== undefined && endpoint !== macros.LIST_COLLEGES) {
      macros.error(obj, endpoint);
    }
  }

  // create with obj or hash or _id (make sure in order and not missing any)
  // func where give array ('host','termId') and it checks if you have all of them
  // func that returns hash (regex to replace (and something else?))
  // equals (instanceof check)
  // propsEqual (no instance of check)
  static create(obj, endpoint) {
    if (arguments.length > 1) {
      macros.error('Keys called with endpoint, but endpoints not supported anymore.');
    }
    return new this(obj, endpoint, {});
  }

  static createWithHash(obj, endpoint) {
    macros.trace('ERROR!', obj, endpoint);
    return new this(obj, endpoint, {
      hashAllowed: true,
    });
  }

  static createWithString(obj) {
    macros.error('Keys called with endpoint, but endpoints not supported anymore.');
    return new this(obj, null, {
      stringAllowed: true,
    });
  }


  // returns neu.edu/201710/CS/4800_4444444/1234, etc
  getHash() {
    if (this.isString) {
      if (!this.host || !this.desc) {
        macros.error();
        return null;
      }

      return `${this.host}/${this.desc.replace(Keys.replacementRegex, '_')}`;
    }
    if (this.hash) {
      if (this.hash.startsWith('/list')) {
        macros.error();
      }
      return this.hash;
    }
    const key = [];

    // create the key
    for (let i = 0; i < Keys.allKeys.length; i++) {
      if (!this[Keys.allKeys[i]]) {
        break;
      }
      key.push(this[Keys.allKeys[i]].replace(Keys.replacementRegex, '_'));
    }
    if (key.length > 0) {
      return key.join('/');
    }

    // Possible if looking up all hosts
    return '';
  }

  getHashWithEndpoint(endpoint) {
    if (this.isString) {
      macros.error();
      return null;
    }
    return `${endpoint}/${this.getHash()}`;
  }

  // Used in BaseData to go from a class that has everything to the classId to what should be requested from the server
  getMinimumKeys() {
    if (this.isString) {
      macros.error();
      return null;
    }
    const retVal = {};
    for (let i = 0; i < minData; i++) {
      const currValue = this[Keys.allKeys[i]];
      if (!currValue) {
        // macros.error()
        break;
      }
      retVal[Keys.allKeys[i]] = currValue;
    }
    return Keys.create(retVal);
  }


  getObj() {
    if (this.isString) {
      return {
        isString: true,
        desc: this.desc,
      };
    }
    if (this.hash) {
      // Can't get obj if given hash
      macros.error();
      return {
        hash: this.hash,
      };
    }


    const retVal = {};

    for (let i = 0; i < Keys.allKeys.length; i++) {
      const currValue = this[Keys.allKeys[i]];
      if (!currValue) {
        break;
      }
      retVal[Keys.allKeys[i]] = currValue;
    }
    return retVal;
  }


  containsAllProperties(arr) {
    if (this.isString) {
      return false;
    }
    for (let i = 0; i < arr.length; i++) {
      if (!this[arr[i]]) {
        return false;
      }
    }
    return true;
  }


  // Ensure that have minimum data required to create an instance or lookup by something
  // This is one prop than need to lookup one row
  // eg. for subject this requrest host and termId
  isValid(endpoint) {
    if (this.isString) {
      return false;
    }
    if (!endpoint) {
      if (this.endpoint) {
        endpoint = this.endpoint;
      } else {
        // Need an endpoint from somewhere to check if this is valid
        macros.error();
        return false;
      }
    }

    const endpointIndex = endpoints.indexOf(endpoint);

    let i = 0;

    for (; i < endpointIndex; i++) {
      if (!this[Keys.allKeys[i]]) {
        return false;
      }
    }

    i++;
    for (; i < Keys.allKeys.length; i++) {
      if (this[Keys.allKeys[i]]) {
        return false;
      }
    }
    return true;
  }

  equals(other) {
    if (!(other instanceof Keys)) {
      return false;
    }
    return this.propsEqual(other);
  }

  // Same as equals but dosen't do an instance check
  // so can be used to compare to a row or and instance of Class or something
  propsEqual(other) {
    if (this.isString && other.isString) {
      return this.desc === other.desc;
    } else if (this.isString || other.isString) {
      return false;
    }
    if (this.hash) {
      if (this.hash === other.hash) {
        return true;
      }
      // else if (other.host) {
      //  macros.error()
      // }
      return false;
    }


    for (let i = 0; i < Keys.allKeys.length; i++) {
      const propName = Keys.allKeys[i];

      //When reached the end, done
      if (this[propName] === undefined) {
        return true;
      }
      if (this[propName] !== other[propName]) {
        return false;
      }
    }
    return true;
  }
}


Keys.allKeys = ['host', 'termId', 'subject', 'classId', 'crn'];
Keys.replacementRegex = /[^A-Za-z0-9.]+/g;


// endpoint string here
// -- grab from dump database, server, all the datas, and ctrl f frontend backend

export default Keys;
