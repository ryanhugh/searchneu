/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

// This file manages the creation of hashes from (host, term, subject, classes, or section) objects.
// Eg Class() that has host: 'neu.edu', termId: '201920', ... crn: '23456'
// would be turned into a hash, eg: 'neu.edu/201920/CS/2500/23456'
// These hashes are deterministic - will always get the same output for a given input
// Yes, this hash isn't actually a hash - there is information about the output in here - but lets treat it as though it is.


// TODO: explain better
// don't substring the hashes
// Don't substring the hash for more information about somet


// This file is used to manage the {host:, termId: subject:...} objects used to get more data.
// This is used in both the backend and the frontend.
// So anything that is required is is added many different places.
import macros from './commonMacros';


// feature request from server.js: add classId if not given classId and given host+termId+subject
// addclassIds. could also benefit from this feature.

// const minData = 2;

const KEYS_REGEX = /[^A-Za-z0-9.]/g;

class Keys {
 
  // Internal use only.
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

  static getHostHash(obj) {
    const hash = this.getHashWithKeysSlice(obj, 1);

    if (!hash) {
      macros.error("Can't make host hash invalid info", obj);
      return null;
    }

    return hash;
  }


  static getTermHash(obj) {
    const hash = this.getHashWithKeysSlice(obj, 2);

    if (!hash) {
      macros.error("Can't make term hash invalid info", obj);
      return null;
    }

    return hash;
  }

  static getSubjectHash(obj) {
    const hash = this.getHashWithKeysSlice(obj, 3);

    if (!hash) {
      macros.error("Can't make subject hash invalid info", obj);
      return null;
    }

    return hash;
  }


  static getClassHash(obj) {
    const hash = this.getHashWithKeysSlice(obj, 4);

    if (!hash) {
      macros.error("Can't make class hash invalid info", obj);
      return null;
    }

    return hash;
  }


  static getSectionHash(obj) {
    const hash = this.getHashWithKeysSlice(obj, 5);

    if (!hash) {
      macros.error("Can't make section hash invalid info", obj);
      return null;
    }

    return hash;
  }

}


Keys.allKeys = ['host', 'termId', 'subject', 'classId', 'crn'];


// endpoint string here
// -- grab from dump database, server, all the datas, and ctrl f frontend backend

export default Keys;
