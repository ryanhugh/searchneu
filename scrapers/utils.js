import URI from 'urijs';
import mkdirp from 'mkdirp-promise';
import fs from 'fs-promise';

import macros from './macros';

exports.parseNameWithSpaces = function parseNameWithSpaces(name) {

  // Standardize spaces.
  name = name.replace(/\s+/gi, ' ')

  // Generate first name and last name
  let spaceCount = exports.occurrences(name, ' ', false);
  const splitName = name.split(' ')


  if (spaceCount === 0) {
    console.log('0 spaces found in name', name)
  }

  // Handles firstName, lastName and firstName, middleName, lastName
  else {
    if (spaceCount > 2) {
      console.log(name, 'has more than 1 space in their name. Using first and last word.');
    }

    let obj = {}

    obj.firstName = splitName[0]
    obj.lastName = splitName[splitName.length - 1]

    return obj;
  }
}

// Standardizes email addresses found across different pages
// Removes a 'mailto:' from the beginning
// Ensures the email contains a @
exports.standardizeEmail = function standardizeEmail(email) {
  if (email.startsWith('mailto:')) {
    email = email.slice('mailto:'.length);
  }

  if (!email.includes('@') || email.includes(' ')) {
    return null;
  }

  if (email.endsWith('@neu.edu')) {
    email = `${email.split('@')[0]}@northeastern.edu`;
  }

  return email.toLowerCase();
};


exports.standardizePhone = function standardizePhone(phone) {
  phone = phone.trim();

  if (phone.startsWith('tel:')) {
    phone = phone.slice('tel:'.length).trim();
  }

  let digitsOnly = phone.replace(/[^0-9]/gi, '');


  if (phone.startsWith('+1') && digitsOnly.length === 11) {
    digitsOnly = digitsOnly.slice(1);
  }

  if (digitsOnly.length !== 10) {
    return null;
  }

  return digitsOnly;
};

exports.parseGoogleScolarLink = function parseGoogleScolarLink(link) {
  if (!link) {
    return null;
  }

  const userId = new URI(link).query(true).user;
  if (!userId && link) {
    exports.log('Error parsing google url', link);
    return null;
  }
  return userId;
};


// http://stackoverflow.com/questions/4009756/how-to-count-string-occurrence-in-string/7924240#7924240
exports.occurrences = function occurrences(string, subString, allowOverlapping) {
  string += '';
  subString += '';
  if (subString.length <= 0) {
    return (string.length + 1);
  }

  let n = 0;
  let pos = 0;
  const step = allowOverlapping ? 1 : subString.length;

  while (true) {
    pos = string.indexOf(subString, pos);
    if (pos >= 0) {
      ++n;
      pos += step;
    } else {
      break;
    }
  }
  return n;
};

exports.loadDevData = async function loadDevData(path) {
  if (!macros.DEV) {
    exports.error('Called load dev data while not in dev mode.');
    return null;
  }

  await mkdirp(macros.DEV_DATA_DIR);
  const exists = await fs.exists(path);
  if (exists) {
    return JSON.parse(await fs.readFile(path));
  }

  return null;
};

exports.saveDevData = async function saveDevData(path, data) {
  if (!macros.DEV) {
    exports.error('Called save dev data while not in dev mode.');
    return;
  }

  await mkdirp(macros.DEV_DATA_DIR);
  await fs.writeFile(path, JSON.stringify(data));
};


// This is for programming errors. This will cause the program to exit anywhere. 
// This *should* never be called.
exports.critical = function critical(...args) {
  exports.error.apply(exports.error, args)
  process.exit(1);
}

// Use this for stuff that should never happen, but does not mean the program cannot continue.
// This will continue running in dev, but will exit on CI
// Will log stack trace
// and cause CI to fail
// so CI will send an email
exports.error = function error(...args) {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  console.error.apply(console.error, ['Error:'].concat(args));
  console.trace();

  // So I get an email about it
  if (process.env.CI) {
    process.exit(1);
  }
};

// Use console.warn to log stuff during testing

// Use this for normal logging
// Will log as normal, but stays silent during testing
exports.log = function log(...args) {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  console.log.apply(console.log, args);
};

exports.verbose = function verbose(...args) {
  if (!process.env.VERBOSE) {
    return;
  }

  console.log.apply(console.log, args);
}

exports.verbose('Starting in verbose mode.');

process.on('unhandledRejection', (err, p) => {
  console.log('An unhandledRejection occurred');
  console.log(`Rejected Promise: ${p}`);
  console.log(`Rejection: ${err.stack}`);
});