/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

// entrypoint for using the node binary itself to run bannerv9Parser.js
// so we can use --heap-prof

const maxTerms = 200;

require('@babel/register');
require('regenerator-runtime/runtime');
require('./bannerv9Parser.js').default.main(`https://nubanner.neu.edu/StudentRegistrationSsb/ssb/classSearch/getTerms?offset=1&max=${maxTerms}&searchTerm=`)
  .then(saveFile)
  .catch(exception => saveFile(exception.toString()))
  .finally(() => console.log('~finally done~'));


function saveFile(obj) {
  const fname = 'cache/result.json';
  require('fs')
    .writeFileSync(fname,
      JSON.stringify(obj, null, 4));
  console.log('saved to file: ' + fname);
}
