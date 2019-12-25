/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import he from 'he';
import Request from '../../request';
import PrereqParser from './prereqParser';

const request = new Request('classParser');

class ClassParser {
  /**
   * Build class data from search results and make additional requests as needed
   * @param SR Search result from /courseSearchResults (browse course catalog)
   */
  async parseClassFromSearchResult(SR, termId, subjectAbbreviationTable) {
    const { subjectCode, courseNumber } = SR;
    const description = await this.getDescription(termId, subjectCode, courseNumber);
    const prereqs = await this.getPrereqs(termId, subjectCode, courseNumber, subjectAbbreviationTable);
    const coreqs = await this.getCoreqs(termId, subjectCode, courseNumber, subjectAbbreviationTable);
    const attributes = await this.getAttributes(termId, subjectCode, courseNumber);

    const classDetails = {
      host: 'neu.edu',
      termId: termId,
      subject: SR.subjectCode,
      classId: courseNumber,
      classAttributes: attributes,
      desc: description,
      prettyUrl: 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?'
        + `cat_term_in=${termId}&subj_code_in=${subjectCode}&crse_numb_in=${courseNumber}`,
      name: SR.courseTitle,
      url: 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?'
        + `term_in=${termId}&subj_in=${subjectCode}&crse_in=${courseNumber}&schd_in=%`,
      lastUpdateTime: Date.now(),
      maxCredits: SR.creditHourLow,
      minCredits: SR.creditHourHigh || SR.creditHourLow,
    };
    if (prereqs) {
      classDetails.prereqs = prereqs;
    }
    if (coreqs) {
      classDetails.coreqs = coreqs;
    }
    return classDetails;
  }

  async getDescription(termId, subject, courseNumber) {
    const req = await this.courseSearchResultsPostRequest('getCourseDescription', termId, subject, courseNumber);
    // Double decode the description, because banner double encodes the description :(
    return he.decode(he.decode(req.body.trim()));
  }

  async getPrereqs(termId, subject, courseNumber, subjectAbbreviationTable) {
    const req = await this.courseSearchResultsPostRequest('getPrerequisites', termId, subject, courseNumber);
    return PrereqParser.serializePrereqs(req.body, subjectAbbreviationTable);
  }

  async getCoreqs(termId, subject, courseNumber, subjectAbbreviationTable) {
    const req = await this.courseSearchResultsPostRequest('getCorequisites', termId, subject, courseNumber);
    return PrereqParser.serializeCoreqs(req.body, subjectAbbreviationTable);
  }

  async getAttributes(termId, subject, courseNumber) {
    const req = await this.courseSearchResultsPostRequest('getCourseAttributes', termId, subject, courseNumber);
    return this.serializeAttributes(req.body);
  }

  serializeAttributes(str) {
    return he.decode(str).split('<br/>').map((a) => { return a.trim(); });
  }

  /**
   * Makes a POST request to
   * https://nubanner.neu.edu/StudentRegistrationSsb/ssb/courseSearchResults/<endpoint>
   * with the body
   * term=000000&subjectCode=XX&courseNumber=0000
   *
   * @param endpoint
   * @param termId
   * @param subject
   * @param courseNumber
   */
  async courseSearchResultsPostRequest(endpoint, termId, subject, courseNumber) {
    /*
     * if the request fails because termId and/or crn are invalid,
     * request will retry 35 attempts before crashing.
     */
    const req = await request.post({
      url: `https://nubanner.neu.edu/StudentRegistrationSsb/ssb/courseSearchResults/${endpoint}`,
      form: {
        term: termId,
        subjectCode: subject,
        courseNumber: courseNumber,
      },
      cache: false,
    });
    return req;
  }
}

export default new ClassParser();
