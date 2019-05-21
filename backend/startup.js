/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

// This is the entry file for running the backend server.
// I don't believe we need any core-js polyfills in the backend but if it breaks we can change it
// require('core-js/stable');

require('@babel/register');
require('regenerator-runtime/runtime');
require('./server.js');
