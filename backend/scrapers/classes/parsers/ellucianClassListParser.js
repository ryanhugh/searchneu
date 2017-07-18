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

'use strict';

import _ from 'lodash';
import he from 'he';
import fs from 'fs';
import URI from 'urijs';
import cheerio from 'cheerio';

import cache from '../../cache';
import macros from '../../../macros';
import Request from '../../request';

var EllucianBaseParser = require('./ellucianBaseParser').EllucianBaseParser;
var ellucianCatalogParser = require('./ellucianCatalogParser');


const request = new Request('EllucianClassListParser');

function EllucianClassListParser() {
  EllucianBaseParser.prototype.constructor.apply(this, arguments);
  this.name = "EllucianClassListParser"
  this.requiredAttrs = [];
}


//prototype constructor
EllucianClassListParser.prototype = Object.create(EllucianBaseParser.prototype);
EllucianClassListParser.prototype.constructor = EllucianClassListParser;



EllucianClassListParser.prototype.supportsPage = function (url) {
  return url.indexOf('bwckctlg.p_display_courses') > -1;
}


// 
EllucianClassListParser.prototype.main = async function(url) {
  
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


EllucianClassListParser.prototype.parse = function (body, url) {


  // Parse the dom
  const $ = cheerio.load(body);

  let aElements = $('a')

  for (var i = 0; i < aElements.length; i++) {
    const element = aElements[i]

    if (!element.attribs.href) {
      continue;
    }

    var url = he.decode(element.attribs.href);

    if (url.startsWith('javascript') || url.startsWith('mailto')) {
      continue;
    };

    // var baseURL = this.getBaseURL(url);
    // if (!baseURL) {
    //   continue;
    // };


    // Fix broken urls. (Have seen this on NEU's site :/)
    if (url.startsWith('http: //')) {
      url = 'http://' + url.slice("http: //".length)
    }

    try {
      url = new URI(url).absoluteTo(url).toString()
    }
    catch (e) {
      macros.error('Ran into an error while parsing a url. Skipping.' ,e , url, baseURL, JSON.stringify(element.attribs), url)
      continue;
    }

    if (!url) {
      continue;
    };

    if (ellucianCatalogParser.supportsPage(url)) {
      console.log('winner winner chicken dinner', url)

      // var dep = pageData.addDep({
      //   url: url
      // })
      // dep.setParser(ellucianCatalogParser)
    }
  }
};



EllucianClassListParser.prototype.EllucianClassListParser = EllucianClassListParser;
module.exports = new EllucianClassListParser();

async function testFunc() {
  module.exports.main('https://wl11gp.neu.edu/udcprod8/bwckctlg.p_display_courses?sel_crse_strt=&sel_crse_end=&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr=&term_in=201810&one_subj=FINA')
}

if (require.main === module) {
  testFunc();
}
