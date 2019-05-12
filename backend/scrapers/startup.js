/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

require('@babel/register');
require('regenerator-runtime/runtime');
const main = require('./main.js');

// This file is the first file ran when calling 'yarn scrape'
// This file is required because babel needs the starting file to be ES5.

main.default.main();
