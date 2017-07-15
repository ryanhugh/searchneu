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

import cheerio from 'cheerio';
import domutils from 'domutils';
import fs from 'fs';
import he from 'he';
import URI from 'urijs';
import _ from 'lodash';

import cache from '../../cache'
import Request from '../../request';
import macros from '../../../macros';


const EllucianBaseParser = require('./ellucianBaseParser').EllucianBaseParser;
const ellucianRequisitesParser = require('./ellucianRequisitesParser');
const ellucianRequisitesParser2 = require('./ellucianRequisitesParser2');


const request = new Request('EllucianSectionParser');


//700+ college sites use this poor interface for their registration
//good thing tho, is that it is easily scrape-able and does not require login to access seats available


function EllucianSectionParser() {
  EllucianBaseParser.prototype.constructor.apply(this, arguments);

  this.name = 'EllucianSectionParser';
}

//prototype constructor
EllucianSectionParser.prototype = Object.create(EllucianBaseParser.prototype);
EllucianSectionParser.prototype.constructor = EllucianSectionParser;


EllucianSectionParser.prototype.main = async function(url) {

  // Possibly load from DEV
  if (macros.DEV && require.main !== module) {
    const devData = await cache.get('dev_data', this.constructor.name, url);
    if (devData) {
      return devData;
    }
  }

  macros.error("RUNING A COLLEGE AGAIN???", url)

  let resp = await request.get(url);
  const $ = cheerio.load(resp.body);

  let allTables = $('td > table.datadisplaytable');

  let matchingTable;

  for (var i = 0; i < allTables.length; i++) {
    const table = $(allTables[i])

    // console.log(table)
    let summary = table.attr('summary')
    if (!summary  || !summary.includes('seating')) {
      continue;
    }

    if (matchingTable) {
      macros.error("Already found a matching table?", url);
      return {};
    }

    matchingTable = table;
  }

  if (!matchingTable) {
    macros.error('Table did not include seating string');
    return {};
  }

  let retVal = this.parseElement(matchingTable[0], url)

  // Possibly save to dev
  if (macros.DEV) {
    await cache.set('dev_data', this.constructor.name, url, retVal);

    // Don't log anything because there would just be too much logging. 
  }

  return retVal;
};



EllucianSectionParser.prototype.supportsPage = function (url) {
  return url.indexOf('bwckschd.p_disp_detail_sched') > -1;
};

EllucianSectionParser.prototype.getDataType = function (pageData) {
  return 'sections';
};



EllucianSectionParser.prototype.parseElement = function (element, url) {
  let retVal = {}
  var tableData = this.parseTable(element);

  if (!tableData || tableData._rowCount === 0 || !tableData.capacity || !tableData.actual || !tableData.remaining) {
    macros.error('ERROR: invalid table in section parser', tableData, url);
    return;
  }

  // Don't need to store all 3 of these numbers. Verify that 2 of them add up to the other one, and then just store 2 of them.
  var seatsCapacity = parseInt(tableData.capacity[0]);
  var seatsActual = parseInt(tableData.actual[0]);
  var seatsRemaining = parseInt(tableData.remaining[0]);

  if (seatsActual + seatsRemaining != seatsCapacity) {
    macros.log('warning, actual + remaining != capacity', seatsCapacity, seatsActual, seatsRemaining, url);

    // Oddly enough, sometimes this check fails.
    // In this case, use the greater number for capacity.
    // https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201630&crn_in=31813
    // https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201630&crn_in=38114
    if (seatsCapacity < seatsActual + seatsRemaining) {
      seatsCapacity = seatsActual + seatsRemaining;
    }
  }

  if (seatsCapacity === undefined) {
    macros.error("Error when parsing seat capacity.", url);
    return {};
  }

  if (seatsRemaining === undefined) {
    macros.error("Error when parsing seatsRemaining.", url);
    return {};
  }

  retVal.seatsCapacity = seatsCapacity;
  retVal.seatsRemaining = seatsRemaining;

  if (tableData._rowCount > 1) {

    var waitCapacity = parseInt(tableData.capacity[1], 10);
    var waitActual = parseInt(tableData.actual[1], 10);
    var waitRemaining = parseInt(tableData.remaining[1], 10);

    if (waitActual + waitRemaining != waitCapacity) {
      macros.log('warning, wait actual + remaining != capacity', waitCapacity, waitActual, waitRemaining, url);

      if (waitCapacity < waitActual + waitRemaining) {
        waitCapacity = waitActual + waitRemaining;
      }
    }

    retVal.waitCapacity = waitCapacity
    retVal.waitRemaining = waitRemaining
  }


  //third row is cross list seats, rarely listed and not doing anyting with that now
  // https://ssb.ccsu.edu/pls/ssb_cPROD/bwckschd.p_disp_detail_sched?term_in=201610&crn_in=12532


  let termId = this.getTermIdFromUrl(url);

  if (!termId) {
    macros.error('Unable to find term id from url?', url);
    return {};
  }

  let fakePageData = {
    dbData: {
      url: url,
      termId: termId
    }
  }


  //find co and pre reqs and restrictions
  var prereqs = ellucianRequisitesParser.parseRequirementSection(fakePageData, element.parent.children, 'prerequisites');
  if (prereqs) {
    retVal.prereqs = prereqs;
  }

  var coreqs = ellucianRequisitesParser.parseRequirementSection(fakePageData, element.parent.children, 'corequisites');
  if (coreqs) {
    retVal.coreqs = coreqs;
  }

  //find co and pre reqs and restrictions
  var prereqs2 = ellucianRequisitesParser2.parseRequirementSection(fakePageData, element.parent.children, 'prerequisites');
  if (!_.isEqual(prereqs, prereqs2)) {
    macros.log("WARNING: prereqs parsed by the new parser are not equal", JSON.stringify(prereqs, null, 4), JSON.stringify(prereqs2, null, 4))
  }

  var coreqs2 = ellucianRequisitesParser2.parseRequirementSection(fakePageData, element.parent.children, 'corequisites');
  if (!_.isEqual(coreqs, coreqs2)) {
    macros.log("WARNING: coreqs parsed by the new parser are not equal", JSON.stringify(coreqs, null, 4), JSON.stringify(coreqs2, null, 4))
  }


  //grab credits
  var text = domutils.getText(element.parent).toLowerCase()
  var creditsParsed = this.parseCredits(text);

  if (creditsParsed) {
    retVal.maxCredits = creditsParsed.maxCredits;
    retVal.minCredits = creditsParsed.minCredits;
  }
  else {
    macros.log('warning, nothing matchied credits', url, text);
  }


  // HONORS NOTES
  // swathmore and sju have "honors" in title 
  // https://myswat.swarthmore.edu/pls/bwckschd.p_disp_detail_sched?term_in=201602&crn_in=25340
  // https://myswat.swarthmore.edu/pls/bwckctlg.p_disp_course_detail?cat_term_in=201602&subj_code_in=MATH&crse_numb_in=016H
  // https://ssb.sju.edu/pls/PRODSSB/bwckctlg.p_disp_course_detail?cat_term_in=201610&subj_code_in=CHM&crse_numb_in=126

  // clemson has Honors in attributes 
  // HOWEVER it also has a "includes honors sections" in the dsecription
  // https://sisssb.clemson.edu/sisbnprd/bwckschd.p_disp_detail_sched?term_in=201608&crn_in=87931

  // gatech has honors in title
  // neu has it in attributes, as different sections in same class
  // https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=201710&subj_in=CS&crse_in=1800&schd_in=LEC
  // 
  // TLDR: class.honors = sectionHtml.includes('honors')


  // grab honors (honours is canadian spelling)
  if (text.includes('honors') || text.includes('honours')) {
    retVal.honors = true;
  }
  else {
    retVal.honors = false;
  }
  return retVal;
};







//this allows subclassing, http://bites.goodeggs.com/posts/export-this/ (Mongoose section)
EllucianSectionParser.prototype.EllucianSectionParser = EllucianSectionParser;
module.exports = new EllucianSectionParser();


async function testFunc() {
  let a = await module.exports.main('https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201810&crn_in=14579');
  console.log(a)
}

if (require.main === module) {
  testFunc()
}
