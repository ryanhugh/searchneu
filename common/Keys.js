/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

// This file manages the creation of hashes from (host, term, subject, classes, or section) objects.
// Eg Class() that has host: 'neu.edu', termId: '201920', ... crn: '23456'
// would be turned into a hash, eg: 'neu.edu/201920/CS/2500/23456'
// These hashes are deterministic - will always get the same output for a given input
// Yes, this hash isn't actually a hash - there is information about the input in the output to help debug - but lets treat it as though it is.
// So like, don't do hash.splice('/') - just create another hash with the info and compare them


// This file is used to manage the {host:, termId: subject:...} objects used to get more data.
// This is used in both the backend and the frontend.
// So anything that is required is is added many different places.
import macros from './commonMacros';

const KEYS_REGEX = /[^A-Za-z0-9.]/g;

class Keys {
  // The five keys to track the five different data structures
  static allKeys = ['host', 'termId', 'subject', 'classId', 'crn']

  // Internal use only.
  // Gets a hash from the object from 0 to the given key index
  // eg if key index is 3 it would be a subject hash - host, termId, subject
  // returns the hash - a string
  static getHashWithKeysSlice(obj, endIndex) {
    if (!obj) {
      return null;
    }

    const keys = Keys.allKeys.slice(0, endIndex);

    const output = [];

    for (const key of keys) {
      // Make sure it has ever key it should.
      if (!obj[key]) {
        return null;
      }

      output.push(obj[key].replace(KEYS_REGEX, '_'));
    }

    if (output.length > 0) {
      return output.join('/');
    }

    return '';
  }

  // Takes in an object with a host field and returns a host hash
  static getHostHash(obj) {
    const hash = this.getHashWithKeysSlice(obj, 1);

    if (!hash) {
      macros.error("Can't make host hash invalid info", obj);
      return null;
    }

    return hash;
  }

  // Takes in an object with a host,termId field and returns a term hash
  static getTermHash(obj) {
    const hash = this.getHashWithKeysSlice(obj, 2);

    if (!hash) {
      macros.error("Can't make term hash invalid info", obj);
      return null;
    }

    return hash;
  }

  // Takes in an object with a host,termId,subject field and returns a subject hash
  static getSubjectHash(obj) {
    const hash = this.getHashWithKeysSlice(obj, 3);

    if (!hash) {
      macros.error("Can't make subject hash invalid info", obj);
      return null;
    }

    return hash;
  }


  // Takes in an object with a host,termId,subject,classId field and returns a class hash
  static getClassHash(obj) {
    const hash = this.getHashWithKeysSlice(obj, 4);

    if (!hash) {
      macros.error("Can't make class hash invalid info", obj);
      return null;
    }

    return hash;
  }

  // Takes in an object with a host,termId,subject,classId,crn field and returns a section hash
  static getSectionHash(obj) {
    const hash = this.getHashWithKeysSlice(obj, 5);

    if (!hash) {
      macros.error("Can't make section hash invalid info", obj);
      return null;
    }

    return hash;
  }
}


export default Keys;
