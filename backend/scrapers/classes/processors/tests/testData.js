/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import fs from 'fs-extra';
import path from 'path';

// This file is responsible for loading the termDump.json and giving different instances of the data to each test.
// It needs to give different instances of the data to each test because the tests modify the data.
// Can use as much RAM as needed.
// It takes about 43 ms to JSON.parse the string. It takes lodash about 80 ms to _.cloneDeep the JS object.
// A way to make this seem faster would be to pre-create a bunch of clones of the data and then store them in RAM,
// and then return them when they are needed, and clone it more times for later.

const filePromise = fs.readFile(path.join(__dirname, 'data', 'termDump.json'));

exports.loadTermDump = async function loadTermDump() {
  const string = await filePromise;
  return JSON.parse(string);
};
