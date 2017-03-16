import path from 'path';
import fs from 'fs-promise';
import mkdirp from 'mkdirp-promise';
import request from 'superagent';
import Throttle from 'superagent-throttle'

import macros from './macros';




let throttle = new Throttle({
  active: true,     // set false to pause queue
  rate: 20,          // how many requests can be sent every `ratePer`
  ratePer: 10000,   // number of ms in which `rate` requests may be sent
  concurrent: 1     // how many requests can be sent concurrently
})
.on('sent', (request) => { console.log('sent') }) // sent a request
.on('received', (request) => { console.log('received') }) // received a response
.on('drained', () => { console.log('drained') }) // received last response




async function fireRequest(url, body = {}, method = 'POST') {

  var actualUrl = `https://coursepro.io${url}`;
  let resp

  if (method === 'GET') {
    resp = await request(actualUrl).set('user-agent', 'hi there').use(throttle.plugin()).retry(5)
  }
  else {
    resp = await request.post(actualUrl).set('user-agent', 'hi there').send(body).use(throttle.plugin()).retry(5)
  }

  // ghetto af retry logic
  if (!resp.text) {
    console.log(actualUrl, 'FAILED', resp.status)
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        resolve(fireRequest(url, body, method))
      }, 1000)
    })
  }

  var output = JSON.parse(resp.text)

  console.log(resp.text.length, ' downloaded')

  return output
}

//TODO: this needs to be a Key.js not this ghetto thing
function getHash(obj) {
  const keys = ['host', 'termId', 'subject', 'classUid', 'crn'];
  const retVal = [];
  keys.forEach((key) => {
    if (!obj[key]) {
      return;
    }
    retVal.push(obj[key].replace('/', '_'));
  });
  return retVal.join('/');
}


async function main() {
  const hosts = await fireRequest('/listColleges');

  console.log(hosts);
  let promises = [];

  hosts.forEach((host) => {
    promises.push(fireRequest('/listTerms', {
      host: host.host.replace('/', '_'),
    }));
  });

  let terms = await Promise.all(promises);

  terms = [].concat(...terms);

  promises = [];

  terms.forEach((term) => {
    promises.push(mkdirp(path.join(macros.PUBLIC_DIR, 'getTermDump', term.host)));
    promises.push(mkdirp(path.join(macros.PUBLIC_DIR, 'getSearchIndex', term.host)));
  });

  await Promise.all(promises);


  promises = [];

  terms.forEach((term) => {
    const termDumpPromises = [];

    const termDump = {
      classMap: {},
      sectionMap: {},
      subjectMap: {},
      termId: term.termId,
      host: term.host,
    };

    termDumpPromises.push(fireRequest(`/listClasses/${term.host}/${term.termId}`, {}, 'GET').then((response) => {
      // Make a map of the hash to the classes
      response.forEach((aClass) => {
        termDump.classMap[getHash(aClass)] = aClass;
      });
    }));


    termDumpPromises.push(fireRequest(`/listSections/${term.host}/${term.termId}`, {}, 'GET').then((response) => {
      // Make a map of the hash to the sections
      response.forEach((section) => {
        termDump.sectionMap[getHash(section)] = section;
      });
    }));


    termDumpPromises.push(fireRequest(`/listSubjects/${term.host}/${term.termId}`, {}, 'GET').then((response) => {
      // Make a map of the hash to the subjects
      response.forEach((subject) => {
        termDump.subjectMap[getHash(subject)] = subject;
      });
    }));

    // Download the search indexies and put them in their own dump
    promises.push(fireRequest(`/getSearchIndex/${term.host}/${term.termId}`, {}, 'GET').then((response) => {
      fs.writeFile(path.join(macros.PUBLIC_DIR, 'getSearchIndex', term.host, term.termId), JSON.stringify(response));
    }));


    // Wait for all the term dump promises and then put them in a different file
    promises.push(Promise.all(termDumpPromises).then(() => {
      fs.writeFile(path.join(macros.PUBLIC_DIR, 'getTermDump', term.host, term.termId), JSON.stringify(termDump));
    }));
  });


  await Promise.all(promises);
  console.log('All Done.');
}


if (require.main === module) {
  main();
}


export default main;