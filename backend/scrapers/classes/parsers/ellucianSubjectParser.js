/*
 * Copyright (c) 2017 Ryan Hughes
 *
 * This file is part of CoursePro.
 *
 * CoursePro is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License
 * version 3 as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>. 
 */


import URI from 'urijs';
import fs from 'fs';
import cheerio from 'cheerio';

import cache from '../../cache';
import macros from '../../../macros';
import Request from '../../request';

var EllucianBaseParser = require('./ellucianBaseParser').EllucianBaseParser;
var ellucianClassListParser = require('./ellucianClassListParser');


const request = new Request('EllucianSubjectParser');


function EllucianSubjectParser() {
  EllucianBaseParser.prototype.constructor.apply(this, arguments);
  this.name = "EllucianSubjectParser";
}


//prototype constructor
EllucianSubjectParser.prototype = Object.create(EllucianBaseParser.prototype);
EllucianSubjectParser.prototype.constructor = EllucianSubjectParser;


EllucianSubjectParser.prototype.supportsPage = function (url) {
  return url.indexOf('bwckgens.p_proc_term_date') > -1;
};

EllucianSubjectParser.prototype.getDataType = function (pageData) {

  // Return null if it is the controller.
  if (pageData.dbData.subject) {
    return 'subjects';
  }
  else {
    return null;
  }
};

EllucianSubjectParser.prototype.getPointerConfig = function (pageData) {
  var config = EllucianBaseParser.prototype.getPointerConfig.apply(this, arguments);
  if (!pageData.dbData.termId) {
    macros.error('in pointer config and dont have termId!!!');
  }

  config.payload = 'p_calling_proc=bwckschd.p_disp_dyn_sched&p_term=' + pageData.dbData.termId
  config.headers = {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
  return config;
};



EllucianSubjectParser.prototype.parse = function (body, url) {

  //parse the form data
  var formData = this.parseSearchPage(body, url);
  var subjects = [];

  formData.payloads.forEach(function (payloadVar) {
    if (payloadVar.name != 'sel_subj') {
      return;
    }

    if (!payloadVar.text || payloadVar.text === '') {
      return;
    }

    if (!payloadVar.value || payloadVar.value === '') {
      return;
    }

    //record all the subjects and their id's
    if (payloadVar.name == 'sel_subj') {
      subjects.push({
        id: payloadVar.value,
        text: payloadVar.text
      });
    }
  }.bind(this));

  if (subjects.length === 0) {
    console.log('ERROR, found 0 subjects??', url);
  }

  let outputSubjects = []


  for (const subject of subjects) {

    outputSubjects.push({
      type: 'subject',
      value: {
        subject: subject.id,
        text: subject.text,
      }
    });
  }

  return outputSubjects
};

EllucianSubjectParser.prototype.addClassLists = async function(subjects, url, termId) {
  
  let classListPromises = {}


  subjects.forEach(function (subject) {
    let classListUrl = this.createClassListUrl(url, termId, subject.value.subject)
    classListPromises[subject.value.subject] = ellucianClassListParser.main(classListUrl)
  }.bind(this))


  // Wait for all the class list promises.
  await Promise.all(Object.values(classListPromises))

  for (const subject of subjects) {
      subject.deps = await classListPromises[subject.value.subject]
  }

  return subjects
};


EllucianSubjectParser.prototype.parseSearchPage = function (body, url) {

  // Parse the dom
  const $ = cheerio.load(body);

  var parsedForm = this.parseForm(url, $('body')[0]);

  //remove sel_subj = ''
  var payloads = [];

  //if there is an all given on the other pages, use those (and don't pick every option)
  //some sites have a limit of 2000 parameters per request, and picking every option sometimes exceeds that
  var allOptionsFound = [];

  parsedForm.payloads.forEach(function (entry) {
    if (entry.name == 'sel_subj' && entry.value == '%') {
      return;
    }
    else if (entry.value == '%') {
      allOptionsFound.push(entry.name);
    }
    payloads.push(entry);
  }.bind(this));


  var finalPayloads = [];

  //loop through again to make sure not includes any values which have an all set
  payloads.forEach(function (entry) {
    if (allOptionsFound.indexOf(entry.name) < 0 || entry.value == '%' || entry.value == 'dummy') {
      finalPayloads.push(entry);
    }
  }.bind(this));

  return {
    postURL: parsedForm.postURL,
    payloads: finalPayloads
  };
};





EllucianSubjectParser.prototype.main = async function(url, termId) {

  const cacheKey = url + termId
  
  // Possibly load from DEV
  if (macros.DEV && require.main !== module) {
    const devData = await cache.get('dev_data', this.constructor.name, cacheKey);
    if (devData) {
      return devData;
    }
  }

  let resp = await request.post({
    url: url,
    body: 'p_calling_proc=bwckschd.p_disp_dyn_sched&p_term=' + termId,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  let subjects = this.parse(resp.body, url)

  subjects = await this.addClassLists(subjects, url, termId)

  // console.log(subjects)


 // Possibly save to dev
  if (macros.DEV) {
    await cache.set('dev_data', this.constructor.name, cacheKey, subjects);

    // Don't log anything because there would just be too much logging. 
  }

  return subjects

};





EllucianSubjectParser.prototype.EllucianSubjectParser = EllucianSubjectParser;
module.exports = new EllucianSubjectParser();

async function testFunc (url, termId) {
  let retVal = await module.exports.main('https://wl11gp.neu.edu/udcprod8/bwckgens.p_proc_term_date', 201810)
  // console.log(retVal)
}

if (require.main === module) {
  testFunc();
}
