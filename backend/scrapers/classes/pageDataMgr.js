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

import macros from '../../macros';
const _ = require('lodash');
const URI = require('urijs');


const parsersClasses = [
  require('./parsers/collegeNamesParser'),
  require('./parsers/ellucianCatalogParser'),
  require('./parsers/ellucianClassListParser'),
  require('./parsers/ellucianClassParser'),
  require('./parsers/ellucianSectionParser'),
  require('./parsers/ellucianSubjectParser'),
  require('./parsers/ellucianTermsParser'),
];

const processors = [
  require('./processors/addClassUids'),
  require('./processors/prereqClassUids'),
  require('./processors/termStartEndDate'),

  // // Add new processors here
  require('./processors/simplifyProfList'),
];

const differentCollegeUrls = require('./differentCollegeUrls');


const parserNames = [];
const parsers = [];
//create a list of parser objects
for (const parserName in parsersClasses) {
  const parser = parsersClasses[parserName];

  if (!parser.name) {
    console.log(parser);
    macros.critical('Parser does not have a name!', parser);
  }

  if (parserNames.includes(parser.name)) {
    console.log(parser.constructor.name, parser.name);
    macros.critical(`Two parsers have the same name! ${parser.name}`);
  }

  parsers.push(parser);
  parserNames.push(parser.name);
}


function PageDataMgr() {

}


PageDataMgr.prototype.getParsers = function getParsers() {
  return parsers;
};


PageDataMgr.prototype.getQuery = function getQuery(pageData) {
  const query = {
    host: pageData.dbData.host,
  };
  const toCopy = ['termId', 'subject', 'classId', 'crn'];
  toCopy.forEach((term) => {
    if (pageData.dbData[term]) {
      query[term] = pageData.dbData[term];
    }
  });
  return query;
};


PageDataMgr.prototype.runPostProcessors = function runPostProcessors(termDump) {
  // Run the processors, sequentially
  for (const processor of processors) {
    processor.go(termDump);
    macros.log('Done processor', processor);
  }


  return termDump;
};

// This is the main starting point for processing a page data.
// This runs once for each time the scrapers are ran. 
// this completes in three large steps:
// 1. parse the website (~20-120 min)
// 2. run the processors (~1 min per processor)
PageDataMgr.prototype.go = function go(pageDatas, callback) {
  for (let i = 0; i < pageDatas.length; i++) {
    const pageData = pageDatas[i];

    //unless this is the initial starting point the parser will be set when loading from db or from parent
    if (!pageData.parser && pageData.dbData.url && pageData.findSupportingParser() === false) {
      return callback('Need parser, or url to get parser and a supporting parser to parse this pagedata', pageData.dbData);
    }
  }

  if (pageDatas.length > 1) {
    // In order to make this work, just run processPageData on each pageData in the array, and then
    // Combine the outputs into one termDump.
    macros.critical('More than 1 pagedata at a time is not supported yet.');
    return null;
  }

  const inputPageData = pageDatas[0];


  return new Promise((resolve, reject) => {
    // Run the parsing
    this.processPageData(inputPageData, (err, pageData) => {
      if (err) {
        macros.error(err);
        reject(err);
        return;
      }
      if (inputPageData !== pageData) {
        macros.error('Input page data was different than output?', inputPageData, pageData);
      }
      let termDump = this.pageDataStructureToTermDump(pageData);
      termDump = this.runPostProcessors(termDump);
      console.log('DONE!!!!!!!!!!!!!!!!!!!!!!!!!');
      resolve(termDump);
    });
  });
};


// This function is called recursively for each page data that is parsed. 
//main starting point for parsing urls
//startingData.url or startingData._id is required
//callback = function (err,pageData) {}
PageDataMgr.prototype.processPageData = function processPageData(pageData, callback) {
  if (!callback) {
    callback = function () {};
  }

  if (pageData.dbData.updatedByParent) {
    return this.finish(pageData, callback);
  }

  //unless this is the initial starting point the parser will be set when loading from db or from parent
  if (!pageData.parser && pageData.dbData.url && pageData.findSupportingParser() === false) {
    return callback('NOSUPPORT');
  }

  //load, then continue
  return this.processPageAfterDbLoad(pageData, callback);
};

PageDataMgr.prototype.processPageAfterDbLoad = function processPageAfterDbLoad(pageData, callback) {
  if (!pageData.dbData.url) {
    console.log('started pageData without url and could not find it in db!', pageData);
    return callback('cant find dep');
  }

  //if haven't found the parser yet, try again
  //this will happen when parent loaded this from cache with just an _id
  if (pageData.dbData.url && !pageData.parser) {
    if (!pageData.findSupportingParser()) {
      macros.error('error cant find parser after second try');
      return callback('NOSUPPORT');
    }
  }

  pageData.parser.parse(pageData, (err) => {
    if (err) {
      macros.error('Error, pagedata parse call failed', err);
      if (pageData.dbData.lastUpdateTime) {
        macros.error('ERROR: url in cache but could not update', pageData.dbData.url, pageData.dbData);
        return callback('NOUPDATE');
      }

      return callback('ENOTFOUND');
    }
    this.finish(pageData, callback);
  });
};


PageDataMgr.prototype.finish = function finish(pageData, callback) {
  pageData.processDeps((err) => {
    if (err) {
      macros.error('ERROR processing deps', err);
      return callback(err);
    }

    callback(null, pageData);
  });
};

// Converts the PageData data structure to a term dump. Term dump has a .classes and a .sections, etc, and is used in the processors
PageDataMgr.prototype.pageDataStructureToTermDump = function pageDataStructureToTermDump(rootPageData) {
  const output = {};

  let stack = [rootPageData];
  let curr = null;
  while ((curr = stack.pop())) {
    const dataType = curr.parser.getDataType(curr);
    if (dataType) {
      if (!output[dataType]) {
        output[dataType] = [];
      }

      const item = {};

      Object.assign(item, curr.dbData);

      delete item.deps;
      delete item.updatedByParent;

      output[dataType].push(item);
    }


    if (curr.deps) {
      stack = stack.concat(curr.deps);
    }
  }

  return output;
};


// Called from the gulpfile with a list of college abbriviates to process
// Get the urls from the file with the urls.
// ['neu', 'gatech', ...]
PageDataMgr.prototype.main = async function main(colllegeAbbrs) {
  const PageData = require('./PageData');

  if (colllegeAbbrs.length > 1) {
    // Need to check the processors... idk
    console.warning('Unsure if can do more than one abbr at at time. Exiting. ');
    return null;
  }


  const urlsToProcess = [];

  differentCollegeUrls.forEach((url) => {
    const urlParsed = new URI(url);

    let primaryHost = urlParsed.hostname().slice(urlParsed.subdomain().length);

    if (primaryHost.startsWith('.')) {
      primaryHost = primaryHost.slice(1);
    }

    primaryHost = primaryHost.split('.')[0];


    if (colllegeAbbrs.includes(primaryHost)) {
      _.pull(colllegeAbbrs, primaryHost);

      urlsToProcess.push(url);
    }
  });

  console.log('Processing ', urlsToProcess);

  const pageDatas = [];

  urlsToProcess.forEach((url) => {
    const pageData = PageData.createFromURL(url);
    if (!PageData) {
      macros.error();
      console.error('ERRROR could not make page data from ', url, 'exiting');
      process.exit();
    }
    pageDatas.push(pageData);
  });

  const termDump = await this.go(pageDatas);

  console.log('Done!');
  return termDump;
};


PageDataMgr.prototype.manual = function manual() {
  const PageData = require('./PageData');

  this.main(['presby']);

  // console.log(process)

  // dbUpdater.updateClassFromMongoId('5683fb2f36b66840e86bab4a',function (err) {
  //  console.log("all done!",err)
  // }.bind(this))
  // return;

  // this.runPostProcessors([{
  //  host: 'neu.edu'
  // }], function (err) {
  //  console.log('DONE!', err);
  // }.bind(this))


  // this.createFromURL('https://selfservice.mypurdue.purdue.edu/prod/bwckschd.p_disp_dyn_sched')
  // this.createFromURL('https://ssb.ccsu.edu/pls/ssb_cPROD/bwckctlg.p_display_courses?term_in=201610&one_subj=MUS&sel_crse_strt=147A&sel_crse_end=147A&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr=')
  // this.createFromURL('https://ssb.ccsu.edu/pls/ssb_cPROD/bwckctlg.p_display_courses?term_in=201610&one_subj=VTE&sel_crse_strt=113&sel_crse_end=113&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr=')
  // this.createFromURL('https://ssb.ccsu.edu/pls/ssb_cPROD/bwckctlg.p_display_courses?term_in=201610&one_subj=TH&sel_crse_strt=488&sel_crse_end=488&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr=')
  // this.createFromURL('https://ssb.ccsu.edu/pls/ssb_cPROD/bwckctlg.p_display_courses?term_in=201610&one_subj=ENG&sel_crse_strt=522&sel_crse_end=522&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr=')
  // this.createFromURL('https://ssb.ccsu.edu/pls/ssb_cPROD/bwckctlg.p_display_courses?term_in=201610&one_subj=TH&sel_crse_strt=488&sel_crse_end=488&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr=')
  // this.createFromURL('https://sisssb.clemson.edu/sisbnprd/bwckctlg.p_display_courses?term_in=201508&one_subj=AL&sel_crse_strt=3510&sel_crse_end=3510&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr=')
  // this.createFromURL('https://nssb-p.adm.fit.edu/prod/bwckctlg.p_display_courses?term_in=201505&one_subj=AVF&sel_crse_strt=1001&sel_crse_end=1001&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr= ')
  // this.createFromURL('https://www2.augustatech.edu/pls/ban8/bwckschd.p_disp_detail_sched?term_in=201614&crn_in=10057 ')
  // this.createFromURL('http://google.com:443/bwckschd.p_disp_detail_sched')
  // this.createFromURL('https://tturedss1.tntech.edu/pls/PROD/bwckschd.p_disp_detail_sched?term_in=201580&crn_in=81020')
  // this.createFromURL('https://bannerweb.upstate.edu/isis/bwckschd.p_disp_detail_sched?term_in=201580&crn_in=83813')
  // this.createFromURL('https://bannerweb.upstate.edu/isis/bwckschd.p_disp_detail_sched?term_in=201580&crn_in=83882')
  // this.createFromURL('https://bappas2.gram.edu:9000/pls/gram/bwckctlg.p_disp_course_detail?cat_term_in=201610&subj_code_in=ACCT&crse_numb_in=405')
  // this.createFromURL('https://genisys.regent.edu/pls/prod/bwckschd.p_disp_detail_sched?term_in=201610&crn_in=10847')
  // this.createFromURL('https://banweb.wm.edu/pls/PROD/bwckschd.p_disp_detail_sched?term_in=201610&crn_in=10068')
  // this.createFromURL('https://jweb.kettering.edu/cku1/bwckschd.p_disp_detail_sched?term_in=201504&crn_in=42746')
  // this.createFromURL('https://bannerweb.upstate.edu/isis/bwckschd.p_disp_detail_sched?term_in=201580&crn_in=83848') // 1 and (2 or 3) prerequs
  // this.createFromURL('https://bannerweb.upstate.edu/isis/bwckctlg.p_disp_listcrse?term_in=201610&subj_in=FAMP&crse_in=1650&schd_in=9') //2 profs
  // this.createFromURL('https://oscar.gatech.edu/pls/bprod/bwckschd.p_disp_detail_sched?term_in=201508&crn_in=90660') //lots of prerequs and 1 coreq
  // this.createFromURL('https://oscar.gatech.edu/pls/bprod/bwckctlg.p_display_courses?term_in=201508&one_subj=AE&sel_crse_strt=2610&sel_crse_end=2610&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr=') //lots of prerequs and 1 coreq
  // this.createFromURL('https://www2.augustatech.edu/pls/ban8/bwckctlg.p_display_courses?term_in=201614&one_subj=WELD&sel_crse_strt=2010&sel_crse_end=2010&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr=')
  // this.createFromURL('https://www2.augustatech.edu/pls/ban8/bwckctlg.p_display_courses?term_in=201614&one_subj=AIRC&sel_crse_strt=1030&sel_crse_end=1030&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr=')
  // this.createFromURL('https://www2.augustatech.edu/pls/ban8/bwckctlg.p_display_courses?term_in=201614&one_subj=AIRC&sel_crse_strt=1030&sel_crse_end=1030&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr=')
  // this.createFromURL('https://genisys.regent.edu/pls/prod/bwckctlg.p_display_courses?term_in=201540&one_subj=PSYC&sel_crse_strt=411&sel_crse_end=411&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr=%20found%20in%20email')
  // this.createFromURL('https://genisys.regent.edu/pls/prod/bwckctlg.p_display_courses?term_in=201610&one_subj=MATH&sel_crse_strt=102&sel_crse_end=102&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr=  ')
  // this.createFromURL('https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201610&crn_in=15633')
  // this.createFromURL('https://prod-ssb-01.dccc.edu/PROD/bwckctlg.p_display_courses?term_in=201509&one_subj=ESS&sel_crse_strt=102&sel_crse_end=102&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr=')
  // this.createFromURL('https://prod-ssb-01.dccc.edu/PROD/bwckschd.p_disp_dyn_sched',function(){
  // this.createFromURL('https://ssb.sju.edu/pls/PRODSSB/bwckschd.p_disp_dyn_sched',function(){
  // this.createFromURL('https://bannerweb.upstate.edu/isis/bwckschd.p_disp_dyn_sched',function (){
  // this.createFromURL('https://tturedss1.tntech.edu/pls/PROD/bwckschd.p_disp_dyn_sched',function (){
  // this.createFromURL('https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=201530&subj_in=MATH&crse_in=1252&schd_in=%25',function () {

  // this.createFromURL('https://ssb.sju.edu/pls/PRODSSB/bwckschd.p_disp_dyn_sched', function () {
  //  console.log('all done!! sju')
  // }.bind(this))


  // var pageData = PageData.create({
  //  dbData: {
  //    _id: '574e401731d808f038eaa79c'

  //  }
  // })

  // // if (!pageData) {
  // //   macros.error('ERROR unable to create page data with _id of ', classMongoId, '????')
  // //   return callback('error')
  // // }
  // pageData.database = classesDB;

  // this.go(pageData,function (err) {
  //  console.log("DONEE",err);
  // }.bind(this))


  // this.go(PageData.createFromURL('https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_dyn_sched'), function () {
  //  console.log('all done!! neu')

  // }.bind(this));


  // var pageData = PageData.createFromURL('https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201710&subj_code_in=EECE&crse_numb_in=2160');
  // var pageData = PageData.createFromURL('https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?schd_in=%&term_in=201710&subj_in=EECE&crse_in=2160');

  // pageData.dbData.termId = '201710';
  // pageData.dbData.host = 'neu.edu'
  // pageData.dbData.subject = 'EECE'

  // // pageData.database = linksDB;
  // pageData.findSupportingParser()


  // console.log(pageData);

  // this.go([pageData], function () {
  //  console.log('all done!! neu')

  // }.bind(this));
  //
  //


  // this.go([PageData.createFromURL('https://oscar.gatech.edu/pls/bprod/bwckschd.p_disp_dyn_sched')], function () {
  //  console.log('all done!! gatech')
  // }.bind(this));

  //  console.log('all done!! neu')
  // }.bind(this))

  // this.createFromURL('https://ssb.banner.usu.edu/zprod/bwckschd.p_disp_dyn_sched', function () {
  // this.createFromURL('https://banners.presby.edu/prod/bwckschd.p_disp_dyn_sched', function () {
  // this.createFromURL('https://sail.oakland.edu/PROD/bwckschd.p_disp_dyn_sched', function () {

  // this.createFromURL('https://tturedss1.tntech.edu/pls/PROD/bwckschd.p_disp_dyn_sched', function () {
  //  console.log('all done!! tntech')
  // }.bind(this))

  // this.createFromURL('https://oscar.gatech.edu/pls/bprod/bwckschd.p_disp_dyn_sched', function () {
  //  console.log('all done!! gatech')
  // }.bind(this))


  // this.createFromURL('https://myswat.swarthmore.edu/pls/bwckschd.p_disp_dyn_sched', function() {
  //  console.log('all done!! swarthmore')
  // }.bind(this))


  // this.createFromURL('https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201640&subj_code_in=BIOE&crse_numb_in=5410',function () {
  // var pageData = PageData.create({
  //  dbData: {
  //    url: 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201640&subj_code_in=BIOE&crse_numb_in=5410',
  //    termId: '201640',
  //    subject: 'BIOE'
  //  }
  // });
  // pageDataMgr.go([pageData], function () {
  //  console.log('done!!')
  // })


  // this.createFromURL('https://myswat.swarthmore.edu/pls/bwckctlg.p_display_courses?term_in=201502&one_subj=MATH&sel_crse_strt=&sel_crse_end=&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr=',function () {
  // this.createFromURL('https://myswat.swarthmore.edu/pls/bwckctlg.p_disp_listcrse?term_in=201502&subj_in=PHYS&crse_in=013&schd_in=%25') //sections have diff names
  // this.createFromURL('https://genisys.regent.edu/pls/prod/bwckctlg.p_disp_listcrse?term_in=201540&subj_in=LAW&crse_in=575&schd_in=%25') //sections have diff names
  // this.createFromURL('https://prd-wlssb.temple.edu/prod8/bwckctlg.p_display_courses?term_in=201503&one_subj=AIRF&sel_crse_strt=&sel_crse_end=&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr=')
  // this.createFromURL('https://myswat.swarthmore.edu/pls/bwckctlg.p_display_courses?term_in=201502&one_subj=MATH&sel_crse_strt=&sel_crse_end=&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr=')
  // this.createFromURL('https://myswat.swarthmore.edu/pls/bwckctlg.p_display_courses?term_in=201502&one_subj=MATH&sel_crse_strt=044&sel_crse_end=044&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr=')

  // this.createFromURL('https://myswat.swarthmore.edu/pls/bwckschd.p_disp_dyn_sched')

  // this.createFromURL('https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_dyn_sched')
  // this.createFromURL('https://myswat.swarthmore.edu/pls/bwckschd.p_disp_detail_sched?term_in=201502&crn_in=22075')
  // return;
};


const instance = new PageDataMgr();


PageDataMgr.prototype.PageDataMgr = PageDataMgr;
global.pageDataMgr = instance;
module.exports = instance;


if (require.main === module) {
  instance.manual();
}
