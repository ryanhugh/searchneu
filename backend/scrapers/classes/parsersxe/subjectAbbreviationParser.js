/* eslint-disable @typescript-eslint/no-use-before-define */
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

const getSubjectAbbreviations = _.memoize(async (termId) => {
  macros.log(`SubjectAbberviationParser: Not memoized. Scraping term ${termId}`);
  const subjectResponse = await requestSubjects(termId);
  return processSubjectListResponse(subjectResponse);
});

async function requestSubjects(termId) {
  const MAX = 500; // If there are more than 500 THIS WILL BREAK. Would make it smarter but not worth it rn.
  const URL = 'https://nubanner.neu.edu/StudentRegistrationSsb/ssb/courseSearch/get_subject';
  const subjectUrl = `${URL}?searchTerm=&term=${termId}&offset=1&max=${MAX}`;
  const response = await request.get({
    url: subjectUrl,
    json: true,
  });
  if (response.statusCode !== 200) {
    macros.error(`Problem with request for subjects ${subjectUrl}`);
  }
  return response.body;
}

function processSubjectListResponse(subjects) {
  subjects = subjects.map((subject) => {
    return {
      subjectCode: subject.code,
      description: he.decode(subject.description),
    };
  });
  subjects = _.keyBy(subjects, 'description');
  return _.mapValues(subjects, 'subjectCode');
}

export default {
  getSubjectAbbreviations: getSubjectAbbreviations,
  // Export for testing https://philipwalton.com/articles/how-to-unit-test-private-functions-in-javascript/
  _processSubjectListResponse: processSubjectListResponse,
};
