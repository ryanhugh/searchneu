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
import macros from '../../../macros';

var BaseParser = require('./baseParser').BaseParser;

class EllucianBaseParser extends BaseParser {


  constructor() {
    super();
    this.requiredInBody = ["Ellucian", '<LINK REL="stylesheet" HREF="/css/web_defaultapp.css" TYPE="text/css">'];
    
  }



  // https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201810&subj_code_in=FINA&crse_numb_in=6283
  parseCatalogUrl(catalogUrl) {
    let urlParsed = new URI(catalogUrl);

    let query = urlParsed.query(true);


    const termId = query.cat_term_in;
    if (!termId || termId.length !== 6) {
      macros.error('Unable to find term_in in', catalogUrl)
      return null;
    }

    const subject = query.subj_code_in;
    if (!subject) {
      macros.error('Unable to find subject in', subject)
      return null;
    }

    const classId = query.crse_numb_in;
    if (!classId) {
      macros.error('Unable to find classId in', classId)
      return null;
    }

    return {
      classId: classId,
      termId: termId,
      subject: subject
    }
  };


  getTermIdFromUrl(url) {
    let urlParsed = new URI(url);

    let query = urlParsed.query(true);
    if (!query.term_in || query.term_in.length !== 6) {
      macros.error('Unable to find term_in in', url)
      return null;
    }

    return query.term_in
  };

  classListURLtoClassInfo (catalogURL) {
    var catalogParsed = new URI(catalogURL);
    if (!catalogParsed || catalogParsed.host() === '') {
      macros.error('error given invalid catalog url?', catalogURL);
      return;
    }

    var query = catalogParsed.query(true);

    var term_in = query.term_in;
    if (!term_in || term_in === '') {
      macros.error('error cant get class url, invalid term', catalogURL)
      return;
    }

    var subj = query.one_subj;
    if (!subj || subj === '') {
      macros.error('error, cant get class url, invalid subj', catalogURL);
      return;
    }

    var startcrse = query.sel_crse_strt;
    if (!startcrse || startcrse === '') {
      macros.error('error, cant get class url, invalid startcrse', catalogURL);
      return;
    }
    var endcrse = query.sel_crse_end;
    if (!endcrse || endcrse === '') {
      macros.error('error, cant get class url, invalid endcrse', catalogURL);
      return;
    }
    if (startcrse != endcrse) {
      macros.error('error, startcrse!=endcrse??', catalogURL, startcrse, endcrse);
      return;
    }
    return {
      classId: startcrse,
      termId: term_in,
      subject: subj
    }
  };

  createClassListUrl (siteURL, termId, subject) {
    var baseURL = this.getBaseURL(siteURL);
    if (!baseURL) {
      macros.error('could not find base url of ', siteURL)
      return;
    };

    baseURL = new URI(baseURL);


    var retVal = new URI('bwckctlg.p_display_courses?sel_crse_strt=&sel_crse_end=&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr=')
    retVal.setQuery('term_in', termId);
    retVal.setQuery('one_subj', subject);

    return retVal.absoluteTo(baseURL).toString();
  };

  createCatalogUrl (siteURL, termId, subject, classId) {
    var baseURL = this.getBaseURL(siteURL);
    if (!baseURL) {
      macros.error('could not find base url of ', siteURL)
      return;
    };

    if (classId === undefined) {
      macros.error('error need class id for catalog url')
      return
    };


    baseURL = new URI(baseURL);


    // var retVal = new URI(baseURL);
    var retVal = new URI('bwckctlg.p_disp_course_detail')
    retVal.setQuery('cat_term_in', termId);
    retVal.setQuery('subj_code_in', subject);
    retVal.setQuery('crse_numb_in', classId);

    return retVal.absoluteTo(baseURL).toString();
  };

  createClassURL (siteURL, termId, subject, classId) {
    var baseURL = this.getBaseURL(siteURL);
    if (!baseURL) {
      macros.error('could not find base url of ', siteURL)
      return;
    };


    baseURL = new URI(baseURL);

    var retVal = new URI('bwckctlg.p_disp_listcrse')

    retVal.setQuery('term_in', termId);
    retVal.setQuery('subj_in', subject);
    retVal.setQuery('crse_in', classId);

    // URI will encoder the % here to a '%25', which will cause the website to return no results.
    return retVal.absoluteTo(baseURL).toString() + '&schd_in=%';
  };

  sectionURLtoInfo (sectionURL) {
    //parse the term from the url
    var query = new URI(sectionURL).query(true);

    var retVal = {}

    if (!query.crn_in) {
      macros.error('could not find crn_in sectionURL!', sectionURL);
      return;
    }
    else {
      retVal.crn = query.crn_in
    }
    return retVal;
  }


  getBaseURL (url) {

    var splitAfter = ['bwckctlg.p', 'bwckschd.p', 'bwckgens.p'];

    for (var i = 0; i < splitAfter.length; i++) {

      var index = url.indexOf(splitAfter[i]);

      if (index > -1) {
        return url.substr(0, index);
      }
    }

    macros.error('Given url does not contain a split from', url);
    return null;
  }

}



EllucianBaseParser.prototype.EllucianBaseParser = EllucianBaseParser;
module.exports = new EllucianBaseParser()


if (require.main === module) {
  
}
