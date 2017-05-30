import path from 'path';
import fs from 'fs';

import commonMacros from '../common/macros';

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


class Macros extends commonMacros {

}


Macros.PUBLIC_DIR = path.join('public', 'data');
Macros.DEV_DATA_DIR = path.join('cache', 'dev_data');

// For iterating over every letter in a couple different places in the code.
Macros.ALPHABET = 'maqwertyuiopsdfghjklzxcvbn';


export default Macros;
