/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 *
 * https://github.com/ryanhugh/searchneu/blob/master/docs/Classes.md#sections
 * A "section" is a specific offering of a course given by the termId and crn.
 * A class has several sections taught by different professors at different times.
 * This module provides a JavaScript interface to scraping the searchResults endpoint of NUBanner.
 * https://jennydaman.gitlab.io/nubanned/dark.html#searchresults
 */
import cheerio from 'cheerio';
import macros from '../../../macros';
import Request from '../../request';
import parseMeetings from './meetingParser';

const request = new Request('searchResultsParser');

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

class SearchResultsParser {
  /**
   * @param searchResultsFromXE the resulting data from
   * https://jennydaman.gitlab.io/nubanned/dark.html#studentregistrationssb-search-get
   * @returns an object that conforms to the SearchNEU backend mergedOutput.sections structure
   */
  async allSectionDetails(searchResultsFromXE) {
    const crn = searchResultsFromXE.courseReferenceNumber;
    const termId = searchResultsFromXE.term;

    const reqs = await Promise.all([
      this.getSeats(termId, crn),
      this.getOnline(termId, crn),
      this.getHonors(termId, crn),
      this.getMeetingTimes(termId, crn),
    ]);

    return this.serializeSectionDetails(reqs, searchResultsFromXE);
  }

  serializeSectionDetails(resolvedPromiseArray, searchResultsFromXE) {
    const someDetails = {};
    resolvedPromiseArray.forEach((detailsObject) => {
      Object.assign(someDetails, detailsObject);
    });
    const crn = searchResultsFromXE.courseReferenceNumber;
    return {
      // object spread on someDetails gives these keys:
      // seatsCapacity: 30,
      // seatsRemaining: 2,
      // waitCapacity: 99,
      // waitRemaining: 99,
      // online: false,
      // honors: false,
      // meetings: [...],
      ...someDetails,
      url: 'https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched'
        + `?term_in=${searchResultsFromXE.term}&crn_in=${crn}`,
      crn: crn,
      lastUpdateTime: Date.now(),
      termId: searchResultsFromXE.term,
      host: 'neu.edu',
      // WARNING: this object is missing the key subCollegeName
      subject: searchResultsFromXE.subject,
      classId: searchResultsFromXE.courseNumber,
    };
  }

  /**
   * https://jennydaman.gitlab.io/nubanned/dark.html#searchresults-enrollment-info-post
   */
  async getSeats(termId, crn) {
    const req = await this.searchResultsPostRequest('getEnrollmentInfo', termId, crn);
    return this.serializeSeats(req);
  }

  /**
   * calls getClassDetails to find out if the class is online
   * @param termId
   * @param crn
   * @return {online: true|false}
   */
  async getOnline(termId, crn) {
    return { online: (await this.getClassDetails(termId, crn)).online };
  }

  /**
   * https://jennydaman.gitlab.io/nubanned/dark.html#searchresults-class-details-post
   */
  async getClassDetails(termId, crn) {
    const req = await this.searchResultsPostRequest('getClassDetails', termId, crn);
    return this.serializeClassDetails(req);
  }

  /**
   * calls getSectionAttributes to determine if it's an honors class (ew)
   * @return {{honors: boolean}}
   */
  async getHonors(termId, crn) {
    const rawAttributes = await this.getSectionAttributes(termId, crn);
    return this.serializeHonors(rawAttributes);
  }

  /**
   * example output:
   * [ 'Honors  GNHN', 'NUpath Natural/Designed World  NCND',
   * 'NU Core Science/Tech Lvl 1  NCT1', 'UG College of Science  UBSC' ]
   *
   * https://jennydaman.gitlab.io/nubanned/dark.html#searchresults-section-attributes-post
   */
  async getSectionAttributes(termId, crn) {
    const req = await this.searchResultsPostRequest('getSectionAttributes', termId, crn);
    return this.serializeAttributes(req);
  }

  /**
   * Makes the request to .../getFacultyMeetingTimes and passes the data to meetingParser.js
   * @return {Promise<{meetings: *}>}
   */
  async getMeetingTimes(termId, crn) {
    const data = await request.get({
      url: 'https://nubanner.neu.edu/StudentRegistrationSsb/ssb/searchResults'
        + `/getFacultyMeetingTimes?term=${termId}&courseReferenceNumber=${crn}`,
      json: true,
    });
    // object so that it can be spread in the calling function above
    return { meetings: parseMeetings(data.body) };
  }


  /**
   * Makes a POST request to
   * https://nubanner.neu.edu/StudentRegistrationSsb/ssb/searchResults/<endpoint>
   * with the body
   * term=000000&courseReferenceNumber=00000
   *
   * @param endpoint
   * @param termId
   * @param crn
   */
  async searchResultsPostRequest(endpoint, termId, crn) {
    /*
     * if the request fails because termId and/or crn are invalid,
     * request will retry 35 attempts before crashing.
     */
    const req = await request.post({
      url: `https://nubanner.neu.edu/StudentRegistrationSsb/ssb/searchResults/${endpoint}`,
      form: {
        term: termId,
        courseReferenceNumber: crn,
      },
      cache: false,
    });
    return req;
  }

  // --------------------------------------------------------------------------------
  // synchronous serialize*() functions translate the request object from nubanner
  // to the SearchNEU backend JSON format
  // --------------------------------------------------------------------------------

  serializeSeats(req) {
    const dom = cheerio.parseHTML(req.body);
    const seats = {
      seatsCapacity: 'Enrollment Maximum:',
      // seatsFilled: 'Enrollment Actual:',  // number of seats that have been filled
      seatsRemaining: 'Enrollment Seats Available:',
      waitCapacity: 'Waitlist Capacity:',
      // waitTaken: 'Waitlist Actual:',  // number of people on the waitlist
      waitRemaining: 'Waitlist Seats Available:',
    };
    for (const [field, domKey] of Object.entries(seats)) {
      try {
        seats[field] = this.extractSeatsFromDom(dom, domKey);
      } catch (err) {
        if (err instanceof NotFoundError) {
          macros.warn(`Problem when finding seat info: "${domKey}" not found.`
            + `\n${req.request.path}`
            + `\n${req.request.body}`
            + '\nSee https://jennydaman.gitlab.io/nubanned/dark.html#searchresults-enrollment-info-post'
            + '\nAssigning field to 0...');
          seats[field] = 0;
        } else {
          macros.error(err);
        }
      }
    }
    return seats;
  }

  serializeClassDetails(req) {
    const dom = cheerio.parseHTML(req.body);
    const $ = cheerio.load(req.body);

    const credits = parseInt(this.extractTextFromDom(dom, 'Credit Hours:'), 10);
    return {
      online: this.extractTextFromDom(dom, 'Campus: ') === 'Online',
      campus: this.extractTextFromDom(dom, 'Campus: '), // eg. 'Boston'
      scheduleType: this.extractTextFromDom(dom, 'Schedule Type: '), // eg. 'Lab' or 'Lecture'
      instructionalMethod: this.extractTextFromDom(dom, 'Instructional Method: '), // eg. 'Traditional' or 'Online'
      sectionNumber: $('#sectionNumber').text(), // eg. '02'
      subject: $('#subject').text(), // eg. 'Physics'
      classId: $('#courseNumber').text(), // eg. '1147'
      name: $('#courseTitle').text(), // eg. 'Physics for Life Sciences 2',
      maxCredits: credits, // eg. 4
      minCredits: credits, // eg. 4
    };
  }

  /**
   * Selects the integer value in the sibling of the element that contains the key text
   * @param domArray should be the result of cheerio.parseHTML
   * @param key {string}
   * @returns {number}
   */
  extractSeatsFromDom(domArray, key) {
    key = key.trim();
    for (let i = 0; i < domArray.length; i++) {
      const ele = cheerio(domArray[i]);
      if (ele.text().trim() === key) { // or should I use string.prototype.includes()?
        return parseInt(ele.next().text().trim(), 10);
      }
    }
    throw new NotFoundError(`text "${key}" not found in domArray`);
  }

  /**
   * Selects the text as a String that follows the element that contains the target key
   * @param domArray should be the result of cheerio.parseHTML
   * @param key {string} text to search for
   * @returns {string}
   */
  extractTextFromDom(domArray, key) {
    key = key.trim();
    for (let i = 0; i < domArray.length - 2; i++) {
      const ele = cheerio(domArray[i]);
      if (ele.text().trim() === key) {
        const textNode = domArray[i + 1];
        // these error checks shouldn't even happen, calling toString() below just in case
        if (textNode.type !== 'text') {
          macros.warn(`Expected a text node in DOM at index ${i + 1}`, domArray);
        }
        if (!textNode.data || typeof textNode.data !== 'string') {
          macros.warn('cheerio parsed HTML text node data is invalid', textNode);
        }
        return textNode.data.toString().trim();
      }
    }
    return null; // did not find the value
  }

  /**
   * @param rawAttributes the output from getSectionAttributes
   * @return {{honors: boolean}}
   */
  serializeHonors(rawAttributes) {
    for (const attr of rawAttributes) {
      if (attr.toLowerCase().includes('honors')) {
        return { honors: true };
      }
    }
    return { honors: false };
  }

  serializeAttributes(req) {
    const $ = cheerio.load(req.body);
    const list = [];
    $('span').each((i) => { // don't need second param, element
      list[i] = $(this).text().trim();
    });
    return list;
  }

  async test() {
    const math1341 = {
      courseReferenceNumber: 10653,
      term: 202010,
      subject: 'MATH',
      classId: '1341',
    };
    const data = await this.allSectionDetails(math1341);
    macros.log(data);
    return data.honors === false && data.online === true;
  }
}


SearchResultsParser.prototype.SearchResultsParser = SearchResultsParser;
const instance = new SearchResultsParser();


if (require.main === module) {
  instance.test();
}

export default instance;
