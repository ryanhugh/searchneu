/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

class TermListParser {
  serializeTermsList(termsFromBanner) {
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

  /**
   * "Spring 2019 Semester" -> "undergraduate"
   * "Spring 2019 Law Quarter" -> "LAW"
   * "Spring 2019 CPS Quarter" -> "CPS"
   *
   * @param termDesc
   * @returns {string}
   */
  determineSubCollegeName(termDesc) {
    if (termDesc.includes('CPS')) {
      return 'CPS';
    }
    if (termDesc.includes('Law')) {
      return 'LAW';
    }
    return 'undergraduate';
  }
}

export default new TermListParser();
