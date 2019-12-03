/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

/**
 * Top level parser. Exposes nice interface to rest of app.
 */
class TermListParser {
function serializeTermsList(termsFromBanner) {
  return termsFromBanner.map((term) => {
    let text = term.description;
    let subCollege = this.determineSubCollegeName(text);
    if (subCollege === 'undergraduate') {
      text = text.replace(/ (Semester|Quarter)/, '');
      subCollege = undefined; // Don't include subcollege if undergrad
    }
    return {
      host: 'neu.edu',
      termId: term.code,
      text: text,
      subCollegeName: subCollege,
    };
  });
}
