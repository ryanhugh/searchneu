/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import _ from 'lodash';
import pMap from 'p-map';
import macros from '../../../macros';
import Request from '../../request';
import ClassParser from './classParser';
import SectionParser from './sectionParser';
import util from './util';

const request = new Request('termParser');

class TermParser {
  /**
   * Parse a term
   * @param termId id of term to get
   * @returns Object {classes, sections} where classes is a list of class data
   */
  async parseTerm(termId) {
    const courseSearchResults = await this.requestsClassesForTerm(termId);
    const classes = await pMap(courseSearchResults,
      (a) => { return ClassParser.parseClassFromSearchResult(a, termId); },
      { concurrency: 500 });

    const searchResults = await this.requestsSectionsForTerm(termId);
    const sections = searchResults.map((a) => { return SectionParser.parseSectionFromSearchResult(a); });
    macros.log(`scraped ${classes.length} classes and ${sections.length} sections`);
    return { classes: classes, sections: sections };
  }

  /**
   * Gets information about all the sections from the given term code.
   * @param termCode
   * @return {Promise<Array>}
   */
  async requestsClassesForTerm(termCode) {
    const cookiejar = await util.getCookiesForSearch(termCode);
    // second, get the total number of sections in this semester
    try {
      return this.concatPagination(async (offset, pageSize) => {
        const req = await request.get({
          url: 'https://nubanner.neu.edu/StudentRegistrationSsb/ssb/courseSearchResults/courseSearchResults',
          qs: {
            txt_term: termCode,
            pageOffset: offset,
            pageMaxSize: pageSize,
          },
          jar: cookiejar,
          json: true,
        });
        if (req.body.success) {
          return { items: req.body.data, totalCount: req.body.totalCount };
        }
        return false;
      });
    } catch (error) {
      macros.error(`Could not get class data for ${termCode}`);
    }
    return Promise.reject();
  }

  /**
   * Gets information about all the sections from the given term code.
   * @param termCode
   * @return {Promise<Array>}
   */
  async requestsSectionsForTerm(termCode) {
    const cookiejar = await util.getCookiesForSearch(termCode);
    // second, get the total number of sections in this semester
    try {
      return this.concatPagination(async (offset, pageSize) => {
        const req = await request.get({
          url: 'https://nubanner.neu.edu/StudentRegistrationSsb/ssb/searchResults/searchResults',
          qs: {
            txt_term: termCode,
            pageOffset: offset,
            pageMaxSize: pageSize,
          },
          jar: cookiejar,
          json: true,
        });
        if (req.body.success) {
          return { items: req.body.data, totalCount: req.body.totalCount };
        }
        return false;
      });
    } catch (error) {
      macros.error(`Could not get section data for ${termCode}`);
    }
    return Promise.reject();
  }

  /**
   * Send paginated requests and merge the results
   * @param {TermParser~doRequest} doRequest - The callback that sends the response.
    */
  async concatPagination(doRequest, itemsPerRequest = 500) {
    // Send initial request just to get the total number of items
    const countRequest = await doRequest(0, 1);
    if (!countRequest) {
      throw Error('Missing data');
    }

    const { totalCount } = countRequest;

    // third, create a thread pool to make requests, 500 items per request.
    // (500 is the limit)
    const sectionsPool = [];
    for (let nextCourseIndex = 0; nextCourseIndex < totalCount; nextCourseIndex += itemsPerRequest) {
      sectionsPool.push(doRequest(nextCourseIndex, itemsPerRequest));
    }

    // finally, merge all the items into one array
    const chunks = await Promise.all(sectionsPool);
    if (chunks.some((s) => { return s === false; })) {
      throw Error('Missing data');
    }
    const sections = _(chunks).map('items').flatten().value();
    return sections;
  }
}

/**
 * @callback TermParser~doRequest
 * @param {number} offset number of items to offset the request pagination
 * @param {number} pageSize number of items to get in the page
 * @returns An object with totalCount and items
 */

const instance = new TermParser();

if (require.main === module) {
  instance.parseTerm('202034');
}

export default instance;
