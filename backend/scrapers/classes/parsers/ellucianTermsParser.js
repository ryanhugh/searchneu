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

import moment from 'moment';
import cheerio from 'cheerio';

import cache from '../../cache';
import macros from '../../../macros';
import Request from '../../request';
var collegeNamesParser = require('./collegeNamesParser');

var EllucianBaseParser = require('./ellucianBaseParser').EllucianBaseParser;
var ellucianSubjectParser = require('./ellucianSubjectParser');


const request = new Request('EllucianTermsParser');


function EllucianTermsParser() {
  EllucianBaseParser.prototype.constructor.apply(this, arguments);
  this.name = "EllucianTermsParser";
}



//prototype constructor
EllucianTermsParser.prototype = Object.create(EllucianBaseParser.prototype);
EllucianTermsParser.prototype.constructor = EllucianTermsParser;



EllucianTermsParser.prototype.getDataType = function (pageData) {
  return 'terms';
};


EllucianTermsParser.prototype.supportsPage = function (url) {
  return url.indexOf('bwckschd.p_disp_dyn_sched') > -1;
};


// 
EllucianTermsParser.prototype.main = async function(url) {
  
  // Possibly load from DEV
  if (macros.DEV && require.main !== module) {
    const devData = await cache.get('dev_data', this.constructor.name, url);
    if (devData) {
      return devData;
    }
  }

  let resp = await request.get(url);

  let retVal = this.parse(resp.body, url)

 // Possibly save to dev
  if (macros.DEV && require.main !== module) {
    await cache.set('dev_data', this.constructor.name, url, retVal);

    // Don't log anything because there would just be too much logging. 
  }

  return retVal

};



EllucianTermsParser.prototype.minYear = function () {
  return moment().subtract(4, 'months').year()
};

EllucianTermsParser.prototype.isValidTerm = function (termId, text) {

  var year = text.match(/\d{4}/);
  var minYear = this.minYear();

  if (!year) {
    macros.log('warning: could not find year for ', text);

    //if the termId starts with the >= current year, then go
    var idYear = parseInt(termId.slice(0, 4), 10)

    //if first 4 numbers of id are within 3 years of the year that it was 4 months ago
    if (idYear + 3 > minYear && idYear - 3 < minYear) {
      return true;
    }
    else {
      return false;
    }
  }

  //skip past years
  if (parseInt(year, 10) < minYear) {
    return false;
  }
  return true;

};



EllucianTermsParser.prototype.parse = async function (body, url) {
  var formData = this.parseTermsPage(body, url);
  var terms = [];

  formData.requestsData.forEach(function (singleRequestPayload) {

    //record all the terms and their id's
    singleRequestPayload.forEach(function (payloadVar) {
      if (this.shouldParseEntry(payloadVar)) {
        terms.push({
          id: payloadVar.value,
          text: payloadVar.text
        });
      }
    }.bind(this));
  }.bind(this));

  if (terms.length === 0) {
    macros.log('ERROR, found 0 terms??', url);
  };

  var host = macros.getBaseHost(url);

  terms.forEach(function (term) {

    //calculate host for each entry
    var host = macros.getBaseHost(url);

    // If this is a term that matches a term in staticHosts
    // Remove 
    let possibleCustomHostAndText = collegeNamesParser.getHostForTermTitle(host, term.text);

    if (possibleCustomHostAndText) {
      term.text = possibleCustomHostAndText.text
      term.host = possibleCustomHostAndText.host
    }

    //add the shorter version of the term string
    term.shortText = term.text.replace(/Quarter|Semester/gi, '').trim()

  }.bind(this))



  let duplicateTexts = {};



  //keep track of texts, and if they are all different with some words removed
  //keep the words out
  terms.forEach(function (term) {

    if (!duplicateTexts[term.host]) {
      duplicateTexts[term.host] = {
        values: [],
        areAllDifferent: true
      }
    }
    if (duplicateTexts[term.host].values.includes(term.shortText)) {
      duplicateTexts[term.host].areAllDifferent = false;
      return;
    }
    duplicateTexts[term.host].values.push(term.shortText)

  }.bind(this))


  //for each host, change the values if they are different
  terms.forEach(function (term) {
    if (duplicateTexts[term.host].areAllDifferent) {
      term.text = term.shortText
    }
  }.bind(this))




  let outputTerms = []


  //the given page data is the controller
  //give the first term to it,
  //and pass the others in as deps + noupdate


  let subjectPromises = {}


  terms.forEach(function (term) {

    macros.log("Parsing term: ", JSON.stringify(term));

    // Parse the subjects. Keep track of all the promises in a map. 
    subjectPromises[term.id] = ellucianSubjectParser.main(formData.postURL, term.id)

  }.bind(this))


  // Wait for all the subjects to be parsed.
  await Promise.all(Object.values(subjectPromises));

  for (const term of terms) {
    outputTerms.push({
      termId: term.id,
      text: term.text,
      host: term.host,
      subjects: await subjectPromises[term.id]
    })
  }

  return outputTerms
};


EllucianTermsParser.prototype.shouldParseEntry = function(entry) {
  if (entry.name == 'p_term'){
    return true;
  }
  else {
    return false;
  }
};



//step 1, select the terms
//starting url is the terms page
EllucianTermsParser.prototype.parseTermsPage = function (body, url) {

  // Parse the dom
  const $ = cheerio.load(body);

  var parsedForm = this.parseForm(url, $('body')[0]);

  if (!parsedForm) {
    macros.error('default form data failed');
    return;
  }

  var defaultFormData = parsedForm.payloads;


  //find the term entry and all the other entries
  var termEntry;
  var otherEntries = [];
  defaultFormData.forEach(function (entry) {
    if (this.shouldParseEntry(entry)) {
      if (termEntry) {
        macros.error("Already and entry???", termEntry)
      }
      termEntry = entry;
    }
    else {
      otherEntries.push(entry);
    }
  }.bind(this));

  if (!termEntry) {
    macros.error('Could not find an entry!', url, JSON.stringify(parsedForm));
    return;
  }

  var requestsData = []; 

  //setup an indidual request for each valid entry on the form - includes the term entry and all other other entries
  termEntry.alts.forEach(function (entry) {
    if (!this.shouldParseEntry(entry)) {
      macros.log('ERROR: entry was alt of term entry but not same name?', entry);
      return;
    }
    entry.text = entry.text.trim()

    if (entry.text.toLowerCase() === 'none') {
      return;
    }
    entry.text = entry.text.replace(/\(view only\)/gi, '').trim();

    entry.text = entry.text.replace(/summer i$/gi, 'Summer 1').replace(/summer ii$/gi, 'Summer 2')

    //dont process this element on error
    if (entry.text.length < 2) {
      macros.log('warning: empty entry.text on form?', entry, url);
      return;
    }

    if (!this.isValidTerm(entry.value, entry.text)) {
      return;
    }


    var fullRequestData = otherEntries.slice(0);

    fullRequestData.push({
      name: entry.name,
      value: entry.value,
      text: entry.text
    });

    requestsData.push(fullRequestData);

  }.bind(this));

  return {
    postURL: parsedForm.postURL,
    requestsData: requestsData
  };
};




EllucianTermsParser.prototype.EllucianTermsParser = EllucianTermsParser;
module.exports = new EllucianTermsParser();


async function testFunc() {
  let r = await module.exports.main('https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_dyn_sched')


  console.log(r)
}


if (require.main === module) {
  testFunc();
}
