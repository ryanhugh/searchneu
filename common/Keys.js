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

const minData = 2;

const KEYS_REGEX = /[^A-Za-z0-9.]/g;

class Keys {
  // constructor(obj, endpoint, config) {
  //   if (obj instanceof Keys) {
  //     macros.error("Keys given instance of itself");
  //   }



  //   if (obj instanceof Keys || !obj || (!obj.hash && !obj.host) || obj.isString) {
  //     macros.error('welp', obj);
  //   }


  //   // Get string off object if creating with string
  //   if (obj.desc && obj.host) {
  //     this.host = obj.host;
  //     this.desc = obj.desc;
  //     this.isString = true;

  //   // Prefer obj over hash
  //   } else if (obj.host) {
  //     let endpointIndex;
  //     let hasAllKeys = true;
  //     let i;
  //     for (i = 0; i < Keys.allKeys.length; i++) {
  //       const currValue = obj[Keys.allKeys[i]];
  //       if (!currValue) {
  //         break;
  //       } else {
  //         this[Keys.allKeys[i]] = currValue;
  //       }
  //     }

  //     i++;
  //     for (; i < Keys.allKeys.length; i++) {
  //       if (obj[Keys.allKeys[i]]) {
  //         // Shouldn't have any keys after first one that isn't present
  //         macros.error(obj, endpoint);
  //       }
  //     }

  //     if (!obj.subject) {
  //       if (obj.host && obj.termId && obj.hash) {
  //         if (obj.hash.startsWith('/list') || obj.hash.startsWith('/') || !config.hashAllowed) {
  //           macros.error(obj);
  //         } else {
  //           // this hash shall be "neu.edu/201710/..."
  //           // A obj hash SHOULD NOT START WITH /LISTsomething
  //           this.hash = obj.hash;
  //           hasAllKeys = true;
  //         }
  //       }
  //     }
  //     if (!hasAllKeys) {
  //       macros.error('dont have all keys', obj, endpoint);
  //     }
  //   }
  // }

  // // create with obj or hash or _id (make sure in order and not missing any)
  // // func where give array ('host','termId') and it checks if you have all of them
  // // func that returns hash (regex to replace (and something else?))
  // // equals (instanceof check)
  // // propsEqual (no instance of check)
  // static create(obj) {
  //   return new this(obj, undefined, {});
  // }

  // Internal use only.
  static getHashWithKeysSlice(obj, endIndex) {
    if (!obj) {
      return null;
    }

    let keys = Keys.allKeys.slice(0, endIndex);

    const output = [];

    for (let key of keys) {

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
    let hash = this.getHashWithKeysSlice(obj, 1);

    if (!hash) {
      macros.error("Can't make host hash invalid info", obj)
      return null;
    }

    return hash;
  }


  static getTermHash(obj) {
    let hash = this.getHashWithKeysSlice(obj, 2);

    if (!hash) {
      macros.error("Can't make term hash invalid info", obj)
      return null;
    }

    return hash;
  }

  static getSubjectHash(obj) {
    let hash = this.getHashWithKeysSlice(obj, 3);

    if (!hash) {
      macros.error("Can't make subject hash invalid info", obj)
      return null;
    }

    return hash;
  }



  static getClassHash(obj) {
    let hash = this.getHashWithKeysSlice(obj, 4);

    if (!hash) {
      macros.error("Can't make class hash invalid info", obj)
      return null;
    }

    return hash;
  }


  static getSectionHash(obj) {
    let hash = this.getHashWithKeysSlice(obj, 5);

    if (!hash) {
      macros.error("Can't make section hash invalid info", obj)
      return null;
    }

    return hash;
  }




  // // returns neu.edu/201710/CS/4800_4444444/1234, etc
  // getHash() {
  //   if (this.isString) {
  //     if (!this.host || !this.desc) {
  //       macros.error();
  //       return null;
  //     }

  //     return `${this.host}/${this.desc.replace(Keys.replacementRegex, '_')}`;
  //   }
  //   if (this.hash) {
  //     if (this.hash.startsWith('/list')) {
  //       macros.error();
  //     }
  //     return this.hash;
  //   }
  //   const key = [];

  //   // create the key
  //   for (let i = 0; i < Keys.allKeys.length; i++) {
  //     if (!this[Keys.allKeys[i]]) {
  //       break;
  //     }
  //     key.push(this[Keys.allKeys[i]].replace(Keys.replacementRegex, '_'));
  //   }
  //   if (key.length > 0) {
  //     return key.join('/');
  //   }

  //   // Possible if looking up all hosts
  //   return '';
  // }

}


Keys.allKeys = ['host', 'termId', 'subject', 'classId', 'crn'];



// endpoint string here
// -- grab from dump database, server, all the datas, and ctrl f frontend backend

export default Keys;
