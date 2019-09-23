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
   * Gets a custom object containing details of a specified section.
   * The result should be further processed,
   * first by copySectionAsClass(s) and finally to stripSectionDetails(s)
   *
   * @param sectionSearchResultsFromXE the resulting data from
   * https://jennydaman.gitlab.io/nubanned/dark.html#studentregistrationssb-search-get
   * @returns many details about the specified section:
   * {
   *   seatsCapacity: 19,
   *   seatsRemaining: 1,
   *   waitCapacity: 0,
   *   waitRemaining: 0,
   *   online: false,
   *   subject: 'Mathematics',
   *   classId: '1341',
   *   name: 'Calculus 1for Sci/Engr (HON)',
   *   maxCredits: 4,
   *   minCredits: 4,
   *   classAttributes: [
   *     'Honors  GNHN', 'NUpath Formal/Quant Reasoning  NCFQ',
   *     'NU Core Math/Anly Think Lvl 1  NCM1', 'UG College of Science  UBSC'
   *   ],
   *   meetings: [
   *     {
   *       startDate: 18143,
   *       endDate: 18234,
   *       profs: [ 'James Hudon' ],
   *       where: 'Hastings Suite 106',
   *       type: 'Class',
   *       times: {
   *         '1': { start: 48900, end: 52800 },
   *         '3': { start: 48900, end: 52800 },
   *         '4': { start: 48900, end: 52800 }
   *       }
   *     },
   *     {
   *       startDate: 18242,
   *       endDate: 18242,
   *       profs: [ 'James Hudon' ],
   *       where: 'TBA',
   *       type: 'Final Exam',
   *       times: { '4': { start: 37800, end: 45000 } }
   *     }
   *   ],
   *   crn: 10653,
   *   lastUpdateTime: 1569121298844,
   *   termId: 202010,
   * }
   */
  async mostDetails(sectionSearchResultsFromXE) {
    const crn = sectionSearchResultsFromXE.courseReferenceNumber;
    const termId = sectionSearchResultsFromXE.term;

    const reqs = await Promise.all([
      this.getSeats(termId, crn),
      this.getClassDetails(termId, crn),
      this.getSectionAttributes(termId, crn),
      this.getMeetingTimes(termId, crn),
    ]);

    return this.spreadPromisedObjects(reqs, sectionSearchResultsFromXE);
  }

  spreadPromisedObjects(resolvedPromiseArray, searchResultsFromXE) {
    const someDetails = {};
    resolvedPromiseArray.forEach((detailsObject) => {
      Object.assign(someDetails, detailsObject);
    });
    const crn = searchResultsFromXE.courseReferenceNumber;
    return {
      ...someDetails,
      lastUpdateTime: Date.now(),
      crn: crn,
      termId: searchResultsFromXE.term,
      // this.getClassDetails(termId, crn) returns the long subject name (e.g. "Mathematics")
      // so it needs to be replaced with the abbreviation (e.g. "MATH")
      subject: searchResultsFromXE.subject,
      host: 'neu.edu', // WARNING: not appending /cps OR /law
      // WARNING: this object is missing the key subCollegeName
    };
  }

  /**
   * Mutates the result from mostDetails(s) to conform to the
   * SearchNEU mergedOutput.sections object
   * @param sectionDetails the result from mostDetails(s)
   */
  stripSectionDetails(sectionDetails) {
    sectionDetails.url = 'https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched'
      + `?term_in=${sectionDetails.termId}&crn_in=${sectionDetails.crn}`;
    sectionDetails.honors = this.containsHonors(sectionDetails.classAttributes);
    delete sectionDetails.classAttributes;
    delete sectionDetails.name;
    delete sectionDetails.maxCredits;
    delete sectionDetails.minCredits;
    return sectionDetails;
  }

  /**
   * Deep copy on values from the result of mostDetails(s) to create
   * a new object which conforms to the SearchNEU mergedOutput.classes object.
   * Makes requests to get the course description, prereqs, and coreqs.
   *
   * the crns array is initialized to be empty (provided crn is not copied over)
   *
   * @param details the result from mostDetails(s)
   */
  async copySectionAsClass(details, subjectAbbreviationTable) {
    const description = await this.getDescription(details.termId, details.crn);
    const prereqs = await this.getPrereqs(details.termId, details.crn, subjectAbbreviationTable);
    const coreqs = await this.getCoreqs(details.termId, details.crn, subjectAbbreviationTable);
    const classDetails = {
      crns: [],
      classAttributes: details.classAttributes,

      desc: description,
      classId: details.classId,
      prettyUrl: 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?'
        + `cat_term_in=${details.termId}&subj_code_in=${details.subject}&crse_numb_in=${details.classId}`,
      name: details.name,
      url: 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?'
        + `term_in=${details.termId}&subj_in=${details.subject}&crse_in=${details.classId}&schd_in=%`,
      lastUpdateTime: details.lastUpdateTime,
      maxCredits: details.maxCredits,
      minCredits: details.minCredits,
      termId: details.termId,
      host: details.host,
      subject: details.subject,
    };
    if (prereqs) {
      classDetails.prereqs = prereqs;
    }
    if (coreqs) {
      classDetails.coreqs = coreqs;
    }
    return classDetails;
  }

  containsHonors(attributesList) {
    for (const attribute of attributesList) {
      if (attribute.toLowerCase().includes('honors')) {
        return true;
      }
    }
    return false;
  }

  /**
   * https://jennydaman.gitlab.io/nubanned/dark.html#searchresults-enrollment-info-post
   */
  async getSeats(termId, crn) {
    const req = await this.searchResultsPostRequest('getEnrollmentInfo', termId, crn);
    return this.serializeSeats(req);
  }

  /**
   * https://jennydaman.gitlab.io/nubanned/dark.html#searchresults-class-details-post
   */
  async getClassDetails(termId, crn) {
    const req = await this.searchResultsPostRequest('getClassDetails', termId, crn);
    return this.serializeClassDetails(req);
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
    return {meetings: parseMeetings(data.body)};
  }

  getDescription(termId, crn) {
    const reqPromise = this.searchResultsPostRequest('getCourseDescription', termId, crn);
    return reqPromise.then(d => d.body.trim());
  }

  async getCoreqs(termId, crn, subjectAbbreviationTable) {
    const req = await this.searchResultsPostRequest('getCorequisites', termId, crn);
    return this.serializeCoreqs(req, subjectAbbreviationTable);
  }

  async getPrereqs(termId, crn, subjectAbbreviationTable) {
    const req = await this.searchResultsPostRequest('getSectionPrerequisites', termId, crn);
    return this.serializePrereqs(req, subjectAbbreviationTable);
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
            + `\nPOST ${req.request.path}`
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
      // THESE ARE NOT USED BY SEARCHNEU
      // create a Github issue to incorporate this information in the front end
      // campus: this.extractTextFromDom(dom, 'Campus: '), // eg. 'Boston'
      // scheduleType: this.extractTextFromDom(dom, 'Schedule Type: '), // eg. 'Lab' or 'Lecture'
      // instructionalMethod: this.extractTextFromDom(dom, 'Instructional Method: '), // eg. 'Traditional' or 'Online'
      // sectionNumber: $('#sectionNumber').text(), // eg. '02'
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

  serializeAttributes(req) {
    const $ = cheerio.load(req.body);
    const list = [];
    $('.attribute-text').each((i, element) => {
      list[i] = $(element).text().trim();
    });
    return {classAttributes: list};
  }

  serializeCoreqs(req, subjectAbbreviationTable) {
    const $ = cheerio.load(req.body);
    const numberOfColumns = $('thead > tr').children().length;
    if (numberOfColumns < 3) {
      return false;
    }
    /*
     * some classes have 5 columns instead of 3.
     *
     * example with 3: CS 2500
     * POST https://nubanner.neu.edu/StudentRegistrationSsb/ssb/searchResults/getCorequisites
     * term=202010&courseReferenceNumber=10461
     *
     * example with 5: HLTH 1201
     * POST https://nubanner.neu.edu/StudentRegistrationSsb/ssb/searchResults/getCorequisites
     * term=202010&courseReferenceNumber=11939
     */
    let subjectIndex = 0;
    let courseNumberIndex = 1;
    if (numberOfColumns === 5) {
      subjectIndex = 1;
      courseNumberIndex = 2;
    }
    const array = [];
    $('tbody tr').each((rowNumber, element) => {
      const row = $(element).children();
      const subjectAbbreviation = this.subjectLookup($(row[subjectIndex]).text(), subjectAbbreviationTable);
      if (subjectAbbreviation) {
        array.push({
          subject: subjectAbbreviation,
          classId: $(row[courseNumberIndex]).text(),
        });
      } else {
        macros.warn("Coreqs: don't know what to do\n"
          + req.body
          + `\nPOST ${req.request.path}`
          + `\n${req.request.body}`);
      }
    });
    return {
      type: 'and',
      values: array,
    };
  }

  // TODO parenthesized prerequisites
  // look at requisiteparser.js
  serializePrereqs(req, subjectAbbreviationTable) {
    const $ = cheerio.load(req.body);
    if ($('thead > tr').children().length < 9) {
      return false;
    }
    const array = [];
    let type = 'and';

    $('tbody tr').each((rowNumber, element) => {
      const row = $(element).children();
      const ao = $(row[0]).text();
      if (ao) {
        type = ao.toLowerCase();
      }

      const leftParen = $(row[1]).text();
      if (leftParen) {
        macros.warn('Parenthesized prerequisites not yet supported.'
          + `\nPOST ${req.request.path}`
          + `\n${req.request.body}`);
        array.push(false);
        return;
      }

      // "Graduate Admissions REQ"
      const graduateAdmissions = $(row[2]).text();
      if (graduateAdmissions) {
        const gradReq = $(row[3]).text();
        array.push(`${graduateAdmissions} ${gradReq}`);
      } else {
        const subjectAbbreviation = this.subjectLookup($(row[4]).text(), subjectAbbreviationTable);
        if (subjectAbbreviation) {
          array.push({
            subject: subjectAbbreviation,
            classId: $(row[5]).text(),
            // level: $(row[6]).text(),
            // grade: $(row[7]).text(),
          });
        } else {
          const rightParen = $(row[8]).text();
          if (!rightParen) {
            macros.warn("Prereqs: don't know what to do\n"
              + req.body
              + `\nPOST ${req.request.path}`
              + `\n${req.request.body}`);
          }
          array.push(false);
        }
      }
    });
    return {
      type: type,
      values: array,
    };
  }

  subjectLookup(description, subjectAbbreviationTable) {
    const code = subjectAbbreviationTable[description];
    if (code) {
      return code;
    }
    return false;
  }

  /**
   * NUBanner displays prerequisites and corequisites by the subject long name, which
   * needs to be looked up and matched to the abbreviated subject codes.
   *
   * @param subjects
   * [
   *   {subject: "CHEM", text: "Chemistry &amp; Chemical Biology"},
   *   {subject: "EEMB", text: "Ecology, Evolutn &amp; Marine Biol"},
   *   ...
   * ]
   * @returns
   * {
   *   "Chemistry & Chemical Biology": "CHEM",
   *   "Ecology, Evolutn & Marine Biol": "EEMB",
   *   ...
   * }
   */
  createSubjectsAbbreviationTable(subjects) {
    const table = {};
    subjects.forEach(subject => {
      // replace HTML escape sequence with correct symbol
      // eg '&amp;' --> '&'
      const description = cheerio.load(subject.text).text();
      if (table[description]) {
        if (table[description] !== subject.subject) {
          macros.warn('Description has more than one subject code.'
            + `\nDescription: "${subject.text}`
            + `\nCodes: "${table[subject.text]}" and "${subject.subject}"`);
        }
      } else {
        table[description] = subject.subject;
      }
    });
    return table;
  }

  async test() {
    const math1341 = {
      courseReferenceNumber: 10653,
      term: 202010,
      subject: 'MATH',
      classId: '1341',
    };
    const data = await this.mostDetails(math1341);
    macros.log(this.stripSectionDetails(data));
    macros.log(await this.copySectionAsClass(data));
    return false;
  }
}


SearchResultsParser.prototype.SearchResultsParser = SearchResultsParser;
const instance = new SearchResultsParser();


if (require.main === module) {
  instance.test();
}

export default instance;
