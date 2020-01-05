import data from './subjectAbbreviationTable.json';

function getSubjectAbberviations() {
  return data;
}

export default {
  getSubjectAbbreviations: getSubjectAbberviations,
};
