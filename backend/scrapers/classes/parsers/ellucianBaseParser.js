/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import URI from 'urijs';
import macros from '../../../macros';
import BaseParser from './baseParser';

class EllucianBaseParser extends BaseParser.BaseParser {
  constructor() {
    super();
    this.requiredInBody = ['Ellucian', '<LINK REL="stylesheet" HREF="/css/web_defaultapp.css" TYPE="text/css">'];
  }


  // https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201810&subj_code_in=FINA&crse_numb_in=6283
  parseCatalogUrl(catalogUrl) {
    const urlParsed = new URI(catalogUrl);

    const query = urlParsed.query(true);


    const termId = query.cat_term_in;
    if (!termId || termId.length !== 6) {
      macros.error('Unable to find term_in in', catalogUrl);
      return null;
    }

    const subject = query.subj_code_in;
    if (!subject) {
      macros.error('Unable to find subject in', subject);
      return null;
    }

    const classId = query.crse_numb_in;
    if (!classId) {
      macros.error('Unable to find classId in', classId);
      return null;
    }

    return {
      classId: classId,
      termId: termId,
      subject: subject,
    };
  }


  getTermIdFromUrl(url) {
    const urlParsed = new URI(url);

    const query = urlParsed.query(true);
    if (!query.term_in || query.term_in.length !== 6) {
      macros.error('Unable to find term_in in', url);
      return null;
    }

    return query.term_in;
  }

  classListURLtoClassInfo(catalogURL) {
    const catalogParsed = new URI(catalogURL);
    if (!catalogParsed || catalogParsed.host() === '') {
      macros.error('error given invalid catalog url?', catalogURL);
      return null;
    }

    const query = catalogParsed.query(true);

    const termIn = query.term_in;
    if (!termIn || termIn === '') {
      macros.error('error cant get class url, invalid term', catalogURL);
      return null;
    }

    const subj = query.one_subj;
    if (!subj || subj === '') {
      macros.error('error, cant get class url, invalid subj', catalogURL);
      return null;
    }

    const startcrse = query.sel_crse_strt;
    if (!startcrse || startcrse === '') {
      macros.error('error, cant get class url, invalid startcrse', catalogURL);
      return null;
    }
    const endcrse = query.sel_crse_end;
    if (!endcrse || endcrse === '') {
      macros.error('error, cant get class url, invalid endcrse', catalogURL);
      return null;
    }
    if (startcrse !== endcrse) {
      macros.error('error, startcrse!=endcrse??', catalogURL, startcrse, endcrse);
      return null;
    }
    return {
      classId: startcrse,
      termId: termIn,
      subject: subj,
    };
  }

  createClassListUrl(siteURL, termId, subject) {
    let baseURL = this.getBaseURL(siteURL);
    if (!baseURL) {
      macros.error('could not find base url of ', siteURL);
      return null;
    }

    baseURL = new URI(baseURL);


    const retVal = new URI('bwckctlg.p_display_courses?sel_crse_strt=&sel_crse_end=&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr=');
    retVal.setQuery('term_in', termId);
    retVal.setQuery('one_subj', subject);

    return retVal.absoluteTo(baseURL).toString();
  }

  createCatalogUrl(siteURL, termId, subject, classId) {
    let baseURL = this.getBaseURL(siteURL);
    if (!baseURL) {
      macros.error('could not find base url of ', siteURL);
      return null;
    }

    if (classId === undefined) {
      macros.error('error need class id for catalog url');
      return null;
    }


    baseURL = new URI(baseURL);


    // var retVal = new URI(baseURL);
    const retVal = new URI('bwckctlg.p_disp_course_detail');
    retVal.setQuery('cat_term_in', termId);
    retVal.setQuery('subj_code_in', subject);
    retVal.setQuery('crse_numb_in', classId);

    return retVal.absoluteTo(baseURL).toString();
  }

  createClassURL(siteURL, termId, subject, classId) {
    let baseURL = this.getBaseURL(siteURL);
    if (!baseURL) {
      macros.error('could not find base url of ', siteURL);
      return null;
    }


    baseURL = new URI(baseURL);

    const retVal = new URI('bwckctlg.p_disp_listcrse');

    retVal.setQuery('term_in', termId);
    retVal.setQuery('subj_in', subject);
    retVal.setQuery('crse_in', classId);

    // URI will encoder the % here to a '%25', which will cause the website to return no results.
    return `${retVal.absoluteTo(baseURL).toString()}&schd_in=%`;
  }

  sectionURLtoInfo(sectionURL) {
    //parse the term from the url
    const query = new URI(sectionURL).query(true);

    const retVal = {};

    if (!query.crn_in) {
      macros.error('could not find crn_in sectionURL!', sectionURL);
      return null;
    }

    retVal.crn = query.crn_in;

    return retVal;
  }


  getBaseURL(url) {
    const splitAfter = ['bwckctlg.p', 'bwckschd.p', 'bwckgens.p'];

    for (let i = 0; i < splitAfter.length; i++) {
      const index = url.indexOf(splitAfter[i]);

      if (index > -1) {
        return url.substr(0, index);
      }
    }

    macros.error('Given url does not contain a split from', url);
    return null;
  }
}


EllucianBaseParser.prototype.EllucianBaseParser = EllucianBaseParser;
export default new EllucianBaseParser();
