/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

// Setup environmental constants. This is used in both the frontend and the backend. The process.env is set in webpack and in package.json
// These are setup in the webpack config


// This class is never instantiated.
// So there is no point in adding a constructor.
class Macros {
  // Use this for normal logging
  // Will log as normal, but stays silent during testing
  static log(...args) {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    console.log(...args); // eslint-disable-line no-console
  }

  static warn(...args) {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    args = ['Warn:'].concat(args);
    console.warn(...args); // eslint-disable-line no-console
  }

  static error(...args) {
    if (Macros.TESTS) {
      return;
    }

    args = ['Error:'].concat(args);

    console.error(...args); // eslint-disable-line no-console
    console.trace(); // eslint-disable-line no-console
  }

  // Replace all instances of a substring with another without a regex (faster).
  // https://stackoverflow.com/questions/16803931/replace-all-without-a-regex-where-can-i-use-the-g
  static replaceAll(string, old, newString) {
    let index = 0;
    do {
      string = string.replace(old, newString);
    } while ((index = string.indexOf(old, index + 1)) > -1);
    return string;
  }


  /** Function that count occurrences of a substring in a string;
   * @param {String} string               The string
   * @param {String} subString            The sub string to search for
   * @param {Boolean} [allowOverlapping]  Optional. (Default:false)
   *
   * @author Vitim.us https://gist.github.com/victornpb/7736865
   * @see Unit Test https://jsfiddle.net/Victornpb/5axuh96u/
   * @see http://stackoverflow.com/questions/4009756/how-to-count-string-occurrence-in-string/7924240#7924240
   */
  static occurrences(string, subString, allowOverlapping = false) {
    string += '';
    subString += '';
    if (subString.length <= 0) return (string.length + 1);

    let n = 0;
    let pos = 0;
    const step = allowOverlapping ? 1 : subString.length;

    while (true) {
      pos = string.indexOf(subString, pos);
      if (pos >= 0) {
        ++n;
        pos += step;
      } else break;
    }
    return n;
  }


  // https://stackoverflow.com/questions/18082/validate-decimal-numbers-in-javascript-isnumeric
  static isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n); //eslint-disable-line no-restricted-globals
  }


  // Strips the middle name from a name.
  // The given full name is the person's full name, including first, middle, and last names
  // Full name is often not equal to first + ' ' + middle + ' ' + last because many people have foreign names and nicknames.
  // If firstName and lastName are passed, the accuracy of this function should be higher.
  // This is used in mobile class panel view.
  // And also when adding professor names (both from the employee data sources and from the classes data sources) to the search index.
  // Even if the middle names are kept, any word that is one character (not including symbols) is still removed).

  // TODO: Remove "Jr." and "III" and other titles.
  // https://www.npmjs.com/package/parse-full-name
  // Might help.
  // Also, could merge the name functions from employees.js into this.
  static stripMiddleName(fullName, keepIfMoreThanOneChar = false, firstName = null, lastName = null) {
    if ((!firstName && lastName) || (firstName && !lastName)) {
      this.error('Need either first and last name or neither first nor last name for stripeMiddleName.');
      return null;
    }

    if (!fullName) {
      return null;
    }


    const indexOfFirstSpace = fullName.indexOf(' ');

    // If there are no spaces in this name, just return the full name.
    if (indexOfFirstSpace === -1) {
      return fullName;
    }


    let nameWithoutFirstAndLastName;

    if (firstName && lastName) {
      if (!fullName.startsWith(firstName)) {
        this.log('Full name does not start with first name?', fullName, '|', firstName);
      }

      if (!fullName.endsWith(lastName)) {
        this.log('Full name does not end with last name?', fullName, '|', lastName);
      }

    // Find the last name and first name by splitting the name by spaces
    } else {
      const indexOfLastSpace = fullName.length - fullName.split('').reverse().join('').indexOf(' ');

      firstName = fullName.slice(0, indexOfFirstSpace);
      lastName = fullName.slice(indexOfLastSpace);
    }

    // No need to calculate the middle name if we are going to drop in anyway.
    if (!keepIfMoreThanOneChar) {
      return `${firstName} ${lastName}`;
    }


    // If their middle name is one character (not including symbols), don't add it to the search index.
    // This prevents profs like Stacy C. Marsella from coming up when you type in [C]
    // First, remove the first and last names and toLowerCase()
    nameWithoutFirstAndLastName = fullName.replace(firstName, '').replace(lastName, '');

    // Then remove symbols.
    nameWithoutFirstAndLastName = nameWithoutFirstAndLastName.replace(/[^a-z0-9]/gi, '');

    // If little to nothing remains, just index the first and last names.
    if (keepIfMoreThanOneChar && nameWithoutFirstAndLastName.length > 1) {
      // Purge middle names that are only one char long
      let fullNameSplit = fullName.split(' ');

      // Of the names that remain, remove the ones that are only 1 letter long (not including symbols)
      fullNameSplit = fullNameSplit.filter((word) => {
        if (word.replace(/[^a-zA-Z0-9]/gi, '').length < 2) {
          return false;
        }

        return true;
      });

      return fullNameSplit.join(' ');
    }

    return `${firstName} ${lastName}`;
  }
}

// XXX: This is stuff that is hardcoded for now, need to change when expanding to other schools.
Macros.collegeName = 'Northeastern University';

// This is the same token in the frontend and the backend, and does not need to be kept private.
Macros.amplitudeToken = 'e0801e33a10c3b66a3c1ac8ebff53359';

// Also decided to keep all the other tracker Id's here because the amplitude one needs to be here and might as well keep them all in the same place.
Macros.fullStoryToken = '4ZDGH';

// Rollbar token
Macros.rollbarToken = '3a76015293344e6f9c47e35c9ce4c84c';

// Google analytics token
Macros.googleAnalyticsToken = 'UA-85376897-3';

// Set up the Macros.TESTS, Macros.DEV, and Macros.PROD based on some env variables.
if (process.env.PROD || process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'prod' || (process.env.CI && process.env.NODE_ENV !== 'test')) {
  Macros.PROD = true;
  console.log('Running in prod mode.'); // eslint-disable-line no-console
} else if (process.env.DEV || process.env.NODE_ENV === 'dev') {
  Macros.DEV = true;
  console.log('Running in dev mode.'); // eslint-disable-line no-console
} else if (process.env.NODE_ENV === 'test') {
  Macros.TESTS = true;
} else {
  console.log(`Unknown env! (${process.env.NODE_ENV}) Setting to dev.`); // eslint-disable-line no-console
  Macros.DEV = true;
}

if (!Macros.PROD) {
  Macros.PROD = false;
}

if (!Macros.DEV) {
  Macros.DEV = false;
}

if (!Macros.TESTS) {
  Macros.TESTS = false;
}


export default Macros;
