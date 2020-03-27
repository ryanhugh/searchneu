/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import path from 'path';
import URI from 'urijs';
import fs from 'fs-extra';
import rollbar from 'rollbar';
import Amplitude from 'amplitude';

import commonMacros from '../common/abstractMacros';

const amplitude = new Amplitude(commonMacros.amplitudeToken);

// Collection of small functions that are used in many different places in the backend.
// This includes things related to saving and loading the dev data, parsing specific fields from pages and more.
// Would be ok with splitting up this file into separate files (eg, one for stuff related to scraping and another one for other stuff) if this file gets too big.
// Stuff in this file can be specific to the backend and will only be ran in the backend.
// If it needs to be ran in both the backend and the frontend, move it to the common macros file :P

// TODO: improve getBaseHost by using a list of top level domains. (public on the internet)

// Change the current working directory to the directory with package.json and .git folder.
const originalCwd = process.cwd();
let oldcwd;
while (1) {
  try {
    fs.statSync('package.json');
  } catch (e) {
    oldcwd = process.cwd();
    //cd .. until in the same dir as package.json, the root of the project
    process.chdir('..');

    // Prevent an infinate loop: If we keep cd'ing upward and we hit the root dir and still haven't found
    // a package.json, just return to the original directory and break out of this loop.
    if (oldcwd === process.cwd()) {
      commonMacros.warn("Can't find directory with package.json, returning to", originalCwd);
      process.chdir(originalCwd);
      break;
    }

    continue;
  }
  break;
}


// This is the JSON object saved in /etc/searchneu/config.json
// null = hasen't been loaded yet.
// {} = it has been loaded, but nothing was found or the file doesn't exist or the file was {}
// {...} = the file
let envVariables = null;

class Macros extends commonMacros {
  static parseNameWithSpaces(name) {
    // Standardize spaces.
    name = name.trim().replace(/\s+/gi, ' ');

    // Generate first name and last name
    const spaceCount = Macros.occurrences(name, ' ', false);
    const splitName = name.split(' ');


    if (spaceCount === 0) {
      Macros.warn('0 spaces found in name', name);
      return null;
    }

    // Handles firstName, lastName and firstName, middleName, lastName

    if (spaceCount > 2) {
      Macros.log(name, 'has more than 1 space in their name. Using first and last word.');
    }

    const obj = {};

    obj.firstName = splitName[0];
    obj.lastName = splitName[splitName.length - 1];

    return obj;
  }

  // Standardizes email addresses found across different pages
  // Removes a 'mailto:' from the beginning
  // Ensures the email contains a @
  static standardizeEmail(email) {
    if (!email) {
      return null;
    }

    if (email.startsWith('mailto:')) {
      email = email.slice('mailto:'.length);
    }

    if (!email.includes('@') || email.includes(' ')) {
      return null;
    }

    if (email.endsWith('@neu.edu')) {
      email = `${email.split('@')[0]}@northeastern.edu`;
    }

    return email.toLowerCase().trim();
  }


  static standardizePhone(phone) {
    if (!phone) {
      return null;
    }

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
  }

  // Parses the google scholar id from a link that should contain a google scholar link.
  // Get the Google Scholar ID with this: https://scholar.google.com/citations?user=[id here]
  static parseGoogleScolarLink(link) {
    if (!link) {
      return null;
    }

    const userId = new URI(link).query(true).user;
    if (!userId && link) {
      Macros.log('Error parsing google url', link);
      return null;
    }
    return userId;
  }


  // Gets the base hostname from a url.
  // fafjl.google.com -> google.com
  // subdomain.bob.co -> bob.co
  // bob.co -> bob.co
  // This could be improved by using public lists of top-level domains.
  static getBaseHost(url) {
    const homepage = new URI(url).hostname();
    if (!homepage || homepage === '') {
      Macros.error('could not find homepage of', url);
      return null;
    }

    const match = homepage.match(/[^.]+\.[^.]+$/i);
    if (!match) {
      Macros.error('homepage match failed...', homepage);
      return null;
    }
    return match[0];
  }


  // http://stackoverflow.com/questions/4009756/how-to-count-string-occurrence-in-string/7924240#7924240
  static occurrences(string, subString, allowOverlapping) {
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
  }

  static getAllEnvVariables() {
    if (envVariables) {
      return envVariables;
    }

    let configFileName = '/etc/searchneu/config.json';

    // Yes, this is syncronous instead of the normal Node.js async style
    // But keeping it sync helps simplify other parts of the code
    // and it only takes 0.2 ms on my Mac.

    let exists = fs.existsSync(configFileName);

    // Also check /mnt/c/etc... in case we are running inside WSL.
    if (!exists) {
      configFileName = '/mnt/c/etc/searchneu/config.json';
      exists = fs.existsSync(configFileName);
    }

    if (!exists) {
      envVariables = {};
    } else {
      envVariables = JSON.parse(fs.readFileSync(configFileName));
    }

    return envVariables;
  }

  static getEnvVariable(name) {
    return this.getAllEnvVariables()[name];
  }

  // Log an event to amplitude. Same function signature as the function for the frontend.
  static async logAmplitudeEvent(type, event) {
    if (!Macros.PROD) {
      return null;
    }

    const data = {
      event_type: type,
      device_id: `Backend ${type}`,
      session_id: Date.now(),
      event_properties: event,
    };

    return amplitude.track(data).catch((error) => {
      Macros.warn('error Logging amplitude event failed:', error);
    });
  }

  // Takes an array of a bunch of thigs to log to rollbar
  // Any of the times in the args array can be an error, and it will be logs according to rollbar's API
  // shouldExit - exit after logging.
  static async logRollbarError(args, shouldExit) {
    // Don't log rollbar stuff outside of Prod
    if (!Macros.PROD) {
      return;
    }

    const rollbarKey = Macros.getEnvVariable('rollbarPostServerItemToken');

    if (!rollbarKey) {
      console.log("Don't have rollbar so not logging error in prod?"); // eslint-disable-line no-console
      console.log(...args); // eslint-disable-line no-console
      return;
    }

    rollbar.init(rollbarKey);

    const stack = (new Error()).stack;

    // The middle object can include any properties and values, much like amplitude.
    args.stack = stack;

    // Search through the args array for an error. If one is found, log that separately.
    let possibleError;

    for (const value of Object.values(args)) {
      if (value instanceof Error) {
        possibleError = value;
        break;
      }
    }

    if (possibleError) {
      // The arguments can come in any order. Any errors should be logged separately.
      // https://docs.rollbar.com/docs/nodejs#section-rollbar-log-
      rollbar.error(possibleError, args, () => {
        if (shouldExit) {
          // And kill the process to recover.
          // forver.js will restart it.
          process.exit(1);
        }
      });
    } else {
      rollbar.error(args, () => {
        if (shouldExit) {
          process.exit(1);
        }
      });
    }
  }


  // This is for programming errors. This will cause the program to exit anywhere.
  // This *should* never be called.
  static critical(...args) {
    if (Macros.TESTS) {
      console.error('macros.critical called'); // eslint-disable-line no-console
      console.error(...args); // eslint-disable-line no-console
    } else {
      Macros.error(...args);
      process.exit(1);
    }
  }


  // Use this for stuff that is bad, and shouldn't happen, but isn't mission critical and can be ignored and the app will continue working
  // Will log something to rollbar and rollbar will send off an email
  static async warn(...args) {
    super.warn(...args);

    if (Macros.PROD) {
      this.logRollbarError(args, false);
    }
  }


  // Use this for stuff that should never happen, but does not mean the program cannot continue.
  // This will continue running in dev, but will exit on CI
  // Will log stack trace
  // and cause CI to fail
  // so CI will send an email
  static async error(...args) {
    super.error(...args);

    if (Macros.PROD) {
      // If running on Travis, just exit 1 and travis will send off an email.
      if (process.env.CI) {
        process.exit(1);

      // If running on AWS, tell rollbar about the error so rollbar sends off an email.
      } else {
        this.logRollbarError(args, true);
      }
    }
  }

  // Use console.warn to log stuff during testing
  static verbose(...args) {
    if (!process.env.VERBOSE) {
      return;
    }

    console.log(...args); // eslint-disable-line no-console
  }
}

// Version of the schema for the data. Any changes in this schema will effect the data saved in the dev_data folder
// and the data saved in the term dumps in the public folder and the search indexes in the public folder.
// Increment this number every time there is a breaking change in the schema.
// This will cause the data to be saved in a different folder in the public data folder.
// The first schema change is here: https://github.com/ryanhugh/searchneu/pull/48
Macros.schemaVersion = 2;

Macros.PUBLIC_DIR = path.join('public', 'data', `v${Macros.schemaVersion}`);
Macros.DEV_DATA_DIR = path.join('dev_data', `v${Macros.schemaVersion}`);

// Folder of the raw html cache for the requests.
Macros.REQUESTS_CACHE_DIR = 'requests';

// For iterating over every letter in a couple different places in the code.
Macros.ALPHABET = 'maqwertyuiopsdfghjklzxcvbn';


Macros.verbose('Starting in verbose mode.');


async function handleUncaught(err) {
  // Don't use the macros.log, because if that crashes it would run into an infinite loop
  console.log('Error: An unhandledRejection occurred.'); // eslint-disable-line no-console
  console.log(`Rejection Stack Trace: ${err.stack}`); // eslint-disable-line no-console
  Macros.error(err.stack);
}


// Sometimes it helps debugging to enable this test mode too.
if ((Macros.PROD || Macros.DEV || 1) && !global.addedRejectionHandler) {
  global.addedRejectionHandler = true;
  process.on('unhandledRejection', handleUncaught);
  process.on('uncaughtException', handleUncaught);
}


export default Macros;
