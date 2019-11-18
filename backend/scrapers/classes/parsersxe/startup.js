/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */
/* eslint-disable */
// entrypoint for using the node binary itself to run bannerv9Parser.js
// so we can use --heap-prof
// use NODE_ENV=prod because caching messes up everything

const maxTerms = 200;

require('@babel/register');
require('regenerator-runtime/runtime');

console.log(`[${new Date()}]\tstarting parsersxe/startup.js`);
require('./bannerv9Parser.js').default.main(`https://nubanner.neu.edu/StudentRegistrationSsb/ssb/classSearch/getTerms?offset=1&max=${maxTerms}&searchTerm=`)
  .then(saveFile)
  .catch((exception) => { return saveFile(exception.toString()); })
  .finally(() => { return console.log(`[${new Date()}]\t~finally done~`); });

function saveFile(obj) {
  const fname = 'cache/result.json';
  require('fs')
    .writeFileSync(fname,
      JSON.stringify(obj, null, 4));
  console.log(`saved to file: ${fname}`);
}
