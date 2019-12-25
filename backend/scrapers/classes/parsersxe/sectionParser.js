/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import parseMeetings from './meetingParser';

class SectionParser {
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
      meetings: parseMeetings(SR.meetingsFaculty),
    };
  }
}

export default new SectionParser();
