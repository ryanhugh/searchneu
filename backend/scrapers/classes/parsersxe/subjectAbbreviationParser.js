/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import _ from 'lodash';
import he from 'he';
import macros from '../../../macros';
import Request from '../../request';

const request = new Request('subjectAbberviationParser');

/**
 * Get the subject abberviations for use in parsing prereqs
 */
class SubjectAbberviationParser {
  async getSubjectAbberviations(termId) {
    const subjectResponse = await this.requestSubjects(termId);
    if (subjectResponse.statusCode !== 200) {
      macros.error(`Problem with request for subjects ${subjectResponse.request.uri.href}`);
    }
    return this.processSubjectListResponse(subjectResponse.body);
  }

  async requestSubjects(termId) {
    const MAX = 200;
    const URL = 'https://nubanner.neu.edu/StudentRegistrationSsb/ssb/classSearch/get_subject';
    const subjectUrl = `${URL}?searchTerm=&term=${termId}&offset=1&max=${MAX}`;
    return request.get({
      url: subjectUrl,
      json: true,
    });
  }

  processSubjectListResponse(subjects) {
    subjects = subjects.map((subject) => {
      return {
        subjectCode: subject.code,
        description: he.decode(subject.description),
      };
    });
    subjects = _.keyBy(subjects, 'description');
    return _.mapValues(subjects, 'subjectCode');
  }
}

export default new SubjectAbberviationParser();
