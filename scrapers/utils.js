import URI from 'urijs';
import mkdirp from 'mkdirp-promise';
import fs from 'fs-promise';

import macros from './macros';

// Standardizes email addresses found across different pages
// Removes a 'mailto:' from the beginning
// Ensures the email contains a @
exports.standardizeEmail = function standardizeEmail(email) {
  if (email.startsWith('mailto:')) {
    email = email.slice('mailto:'.length);
  }

  if (!email.includes('@')) {
    return null;
  }

  return email;
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
    exports.elog('Called load dev data while not in dev mode.');
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
    exports.elog('Called save dev data while not in dev mode.');
    return;
  }

  await mkdirp(macros.DEV_DATA_DIR);
  await fs.writeFile(path, JSON.stringify(data));
};

// Use this for stuff that should never happen
// Will log stack trace
// and cause CI to fail
// so CI will send an email
exports.error = function error(...args) {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  console.error.apply(console.error, args);
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

exports.verbose('Starting in verbose mode');

process.on('unhandledRejection', (err, p) => {
  console.log('An unhandledRejection occurred');
  console.log(`Rejected Promise: ${p}`);
  console.log(`Rejection: ${err.stack}`);
});