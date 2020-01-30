/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import _ from 'lodash';
import Request from '../../request';
import TermListParser from './termListParser';
import TermParser from './termParser';
import ClassParser from './classParser';
import util from './util';
import SectionParser from './sectionParser';

const request = new Request('bannerv9Parser');

/**
 * Top level parser. Exposes nice interface to rest of app.
 */
class Bannerv9Parser {
  async main(termsUrl) {
    const termIds = (await this.getTermList(termsUrl)).map((t) => { return t.termId; });
    const suffixes = ['10', '30', '40', '50', '60'];
    const undergradIds = termIds.filter((t) => { return suffixes.includes(t.slice(-2)); });
    return this.scrapeTerms(undergradIds.slice(0, 1));
  }

  /**
   * Get the list of all available terms given the starting url
   * @param termsUrl the starting url to find the terms with v9
   * @returns List of {termId, description}
   */
  async getTermList(termsUrl) {
    const bannerTerms = await request.get({ url: termsUrl, json: true });
    return TermListParser.serializeTermsList(bannerTerms.body);
  }

  /**
   * Scrape all the class data in a set of terms
   * @param termIds array of terms to scrape in
   * @returns Object {classes, sections} where classes is a list of class data
   */
  async scrapeTerms(termIds) {
    const termData = await util.promiseMap(termIds, (p) => { return TermParser.parseTerm(p); });
    return _.mergeWith(...termData, (a, b) => { return a.concat(b); });
  }

  /**
   * Scrape all the details of a specific class and associated sections
   * @param termId termId the class is in
   * @param subject the subject of the class ("CS")
   * @param classId the course number of the class (2500)
   * @returns Object {classes, sections} where classes and sections are arrays,
   *          though classes should only have 1 element
   */
  async scrapeClass(termId, subject, courseNumber) {
    return {
      classes: ClassParser.parseClass(termId, subject, courseNumber),
      sections: SectionParser.parseSectionsOfClass(termId, subject, courseNumber),
    };
  }

  // Just a convient test method, if you want to
  async test() {
    const numTerms = 10;
    const url = `https://nubanner.neu.edu/StudentRegistrationSsb/ssb/classSearch/getTerms?offset=1&max=${numTerms}&searchTerm=`;
    const output = await this.main(url);
    // eslint-disable-next-line global-require
    require('fs').writeFileSync('parsersxe.json', JSON.stringify(output, null, 4));
  }
}

Bannerv9Parser.prototype.Bannerv9Parser = Bannerv9Parser;
const instance = new Bannerv9Parser();


if (require.main === module) {
  instance.test();
}

export default instance;
