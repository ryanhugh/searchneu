/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

// This file is responsible for mocking out the randomstring module.
// This will always return the same string for a given input.

import macros from '../../macros';

export default {
  generate: (length) => {
    if (!macros.isNumeric(length)) {
      length = 10;
    }

    let output = '';
    while (output.length < length) {
      output += '0';
    }
    return output;
  },
};
