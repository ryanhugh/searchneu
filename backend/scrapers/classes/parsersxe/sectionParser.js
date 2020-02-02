/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import Request from '../../request';
import util from './util';
import MeetingParser from './meetingParser';

const request = new Request('sectionParser');

class SectionParser {
  async parseSectionsOfClass(termId, subject, courseNumber) {
    const cookiejar = await util.getCookiesForSearch(termId);
    const req = await request.get({
      url: 'https://nubanner.neu.edu/StudentRegistrationSsb/ssb/searchResults/searchResults',
      qs: {
        txt_term: termId,
        txt_subject: subject,
        txt_courseNumber: courseNumber,
        pageOffset: 0,
        pageMaxSize: 500,
      },
      jar: cookiejar,
      json: true,
    });
    if (req.body.success) {
      return req.body.data.map((sr) => { return this.parseSectionFromSearchResult(sr); });
    }
    return false;
  }

  /**
   * Search results already has all relevant section data
   * @param SR Section item from /searchResults
   */
  parseSectionFromSearchResult(SR) {
    return {
      host: 'neu.edu',
      termId: SR.term,
      subject: SR.subject,
      classId: SR.courseNumber,
      crn: SR.courseReferenceNumber,
      seatsCapacity: SR.maximumEnrollment,
      seatsRemaining: SR.seatsAvailable,
      waitCapacity: SR.waitCapacity,
      waitRemaining: SR.waitAvailable,
      online: SR.campusDescription === 'Online',
      honors: SR.sectionAttributes.some((a) => { return a.description === 'Honors'; }),
      url: 'https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched'
      + `?term_in=${SR.term}&crn_in=${SR.courseReferenceNumber}`,
      profs: SR.faculty.map(MeetingParser.profName),
      meetings: MeetingParser.parseMeetings(SR.meetingsFaculty),
    };
  }
}

export default new SectionParser();
