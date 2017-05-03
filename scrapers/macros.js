import path from 'path';
import fs from 'fs';

// Change the current working directory to the directory with package.json and .git folder.
while (1) {
  try {
    fs.statSync('.git');
  } catch (e) {
    //cd .. until in the same dir as package.json, the root of the project
    process.chdir('..');
    continue;
  }
  break;
}


exports.PUBLIC_DIR = path.join('public', 'data');
exports.DEV_DATA_DIR = path.join('dev_data_dir');

// For iterating over every letter in a couple different places in the code
exports.ALPHABET = 'maqwertyuiopsdfghjklzxcvbn';

// whether the scrapers are running in prod mode or not.
// When in dev mode, each file will save its outputs to a file
// so can run the step after it without scraping each time
if (process.env.NODE_ENV === 'test') {
  exports.UNIT_TESTS = true;
  exports.PROD = false;
  exports.DEV = false;
}
else {
  exports.PROD = !!process.env.PROD;
  exports.DEV = !exports.PROD;
}

