/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import domutils from 'domutils';
import _ from 'lodash';
import cheerio from 'cheerio';

import cache from '../../cache';
import macros from '../../../macros';
import Request from '../../request';
import EllucianBaseParser from './ellucianBaseParser';
import ellucianClassParser from './ellucianClassParser';
import ellucianRequisitesParser from './ellucianRequisitesParser';


const request = new Request('EllucianCatalogParser');

class EllucianCatalogParser extends EllucianBaseParser.EllucianBaseParser {
  supportsPage(url) {
    return url.indexOf('bwckctlg.p_disp_course_detail') > -1;
  }


  parseClass(element, url) {
    const { termId, classId, subject } = this.parseCatalogUrl(url);

    const depData = {
      desc: '',
      classId: classId,
    };


    depData.prettyUrl = url;


    let value;

    try {
      //get the class name
      value = domutils.getText(element);
    } catch (e) {
      macros.warn(element);
      macros.warn('ERROR Dom utils crashed?', url, e, element);
      return null;
    }


    const match = value.match(/.+?\s-\s*(.+)/i);
    if (!match || match.length < 2 || match[1].length < 2) {
      macros.error('could not find title!', match, value, url);
      return null;
    }
    depData.name = this.standardizeClassName(match[1]);


    //find the box below this row
    let descTR = element.parent.next;
    while (descTR.type !== 'tag') {
      descTR = descTR.next;
    }
    const rows = domutils.getElementsByTagName('td', descTR);
    if (rows.length !== 1) {
      macros.error('td rows !=1??', depData.classId, url);
      return null;
    }

    element = rows[0];

    //get credits from element.parent.text here

    //grab credits
    const text = domutils.getText(element.parent);
    const creditsParsed = this.parseCredits(text);

    if (creditsParsed) {
      depData.maxCredits = creditsParsed.maxCredits;
      depData.minCredits = creditsParsed.minCredits;
    } else {
      macros.log('warning, nothing matched credits', url);
    }

    const scheduleType = this.parseScheduleType(text);
    depData.scheduleType = scheduleType;

    const classAttributes = this.parseCourseAttr(text);

    if (classAttributes) {
      depData.classAttributes = classAttributes;
    } else {
      macros.log('warning, nothing matched course attributes', url);
    }


    //desc
    //list all texts between this and next element, not including <br> or <i>
    //usally stop at <span> or <p>
    for (let i = 0; i < element.children.length; i++) {
      if (element.children[i].type === 'tag' && !['i', 'br', 'a'].includes(element.children[i].name)) {
        break;
      }
      depData.desc += `  ${domutils.getText(element.children[i]).trim()}`;
    }

    depData.desc = depData.desc.replace(/\n|\r/gi, ' ').trim();

    //remove credit hours
    // 0.000 TO 1.000 Credit hours
    depData.desc = depData.desc.replace(/(\d+(\.\d+)?\s+TO\s+)?\d+(.\d+)?\s+credit hours/gi, '').trim();

    depData.desc = depData.desc.replace(/\s+/gi, ' ').trim();

    const invalidDescriptions = ['xml extract', 'new search'];

    if (invalidDescriptions.includes(depData.desc.trim().toLowerCase())) {
      return null;
    }


    //url
    depData.url = this.createClassURL(url, termId, subject, classId);
    if (!depData.url) {
      macros.log('error could not create class url', depData);
      return null;
    }

    //find co and pre reqs and restrictions
    const prereqs = ellucianRequisitesParser.parseRequirementSection(url, element.children, 'prerequisites');

    const coreqs = ellucianRequisitesParser.parseRequirementSection(url, element.children, 'corequisites');

    if (prereqs) {
      depData.prereqs = prereqs;
    }

    if (coreqs) {
      depData.coreqs = coreqs;
    }

    return depData;
  }


  parse(body, url) {
    // Parse the dom
    const $ = cheerio.load(body);

    const elements = $('td.nttitle');

    let matchingElement;

    for (let i = 0; i < elements.length; i++) {
      const currElement = elements[i];

      if (matchingElement) {
        macros.error('Already have a matching element', elements, elements.length);
      }

      if (currElement.parent.parent.attribs.summary.includes('term')) {
        matchingElement = currElement;
      }
    }

    if (!matchingElement) {
      macros.warn('Could not find catalog page details on this page - no matching element!', url);
      return null;
    }

    return this.parseClass(matchingElement, url);
  }


  async main(url) {
    // Possibly load from DEV
    if (macros.DEV && require.main !== module) {
      const devData = await cache.get(macros.DEV_DATA_DIR, this.constructor.name, url);
      if (devData) {
        return devData;
      }
    }

    const resp = await request.get(url);

    // This is the raw JSON data from the catalog page. No wrapper object with type and value.
    const catalogData = this.parse(resp.body, url);

    // There was an error parsing the catalog data.
    if (!catalogData) {
      macros.warn('unable to update catalog data:', url);
      return null;
    }

    // This is a list of class wrapper objects that have deps of sections
    const classWrapper = await ellucianClassParser.main(catalogData.url, catalogData.name);

    // from the class parser:
    // { name: 'Advanced Writing in the Technical Professions',
    //  url: 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=201810&subj_in=ENGW&crse_in=3302&schd_in=LEC',
    //  crns: [Object],
    //  honors: false,
    //  prereqs: [Object],
    //  maxCredits: 4,
    //  minCredits: 4 },


    // from the catalog parser:
    //  "desc": "This course introduces students to the procedu [...] once. 5.000 Lecture hours",
    //  "classId": "6100",
    //  "prettyUrl": "https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201812&subj_code_in=LAW&crse_numb_in=6100",
    //  "name": "Civil Procedure",
    //  "maxCredits": 5,
    //  "minCredits": 5,
    //  "url": "https:,
    //  "scheduleType": "Seminar"

    // Copy over a bunch of properties from the ellucianClassParser output to the object generated by this parser.
    classWrapper.value.desc = catalogData.desc;
    classWrapper.value.classId = catalogData.classId;
    classWrapper.value.prettyUrl = catalogData.prettyUrl;
    classWrapper.value.name = catalogData.name;
    classWrapper.value.url = catalogData.url;
    classWrapper.value.lastUpdateTime = Date.now();
    classWrapper.value.scheduleType = catalogData.scheduleType;

    // Compare the classAttributes from the catalog parser vs from the class parsers. Keep the catalog one if they conflict.
    if (catalogData.classAttributes) {
      if (classWrapper.value.classAttributes && !_.isEqual(classWrapper.value.classAttributes, catalogData.classAttributes) && !process.env.CI) {
        macros.log('Not overriding catalog classAttributes attributes with class classAttributes...', catalogData.url);
      }
      classWrapper.value.classAttributes = catalogData.classAttributes;
    }


    classWrapper.value.classAttributes = catalogData.classAttributes;

    // Merge the data about the class from the catalog page with the data about the class from the class page.
    // Merge min credits and max credits.
    if (!classWrapper.value.maxCredits || classWrapper.value.maxCredits < catalogData.maxCredits) {
      classWrapper.value.maxCredits = catalogData.maxCredits;
    }

    if (!classWrapper.value.minCredits || classWrapper.value.minCredits > catalogData.minCredits) {
      classWrapper.value.minCredits = catalogData.minCredits;
    }

    if (catalogData.prereqs) {
      // If they both exists and are different I don't really have a great idea of what to do haha
      // Hopefully this _.isEquals dosen't take too long.

      if (classWrapper.value.prereqs && !_.isEqual(classWrapper.value.prereqs, catalogData.prereqs)) {
        macros.log('Not overriding class prereqs with catalog prereqs...', catalogData.url);
      } else {
        classWrapper.value.prereqs = catalogData.prereqs;
      }
    }

    // Do the same thing for coreqs
    if (catalogData.coreqs) {
      if (classWrapper.value.coreqs && !_.isEqual(classWrapper.value.coreqs, catalogData.coreqs)) {
        macros.log('Not overriding class coreqs with catalog coreqs...', catalogData.url);
      } else {
        classWrapper.value.coreqs = catalogData.coreqs;
      }
    }

    // Possibly save to dev
    if (macros.DEV && require.main !== module) {
      await cache.set(macros.DEV_DATA_DIR, this.constructor.name, url, classWrapper);
    }

    return classWrapper;
  }

  async test() {
    // const output = await this.main('https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201810&subj_code_in=FINA&crse_numb_in=6283');
    // const output = await this.main('https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201810&subj_code_in=ENGW&crse_numb_in=3302');
    const output = await this.main('https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201830&subj_code_in=GAME&crse_numb_in=3700');
    macros.log('output:', JSON.stringify(output, null, 4));
  }
}


EllucianCatalogParser.prototype.EllucianCatalogParser = EllucianCatalogParser;
const instance = new EllucianCatalogParser();

if (require.main === module) {
  instance.test();
}

export default instance;
