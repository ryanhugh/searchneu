/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import _ from 'lodash';
import cheerio from 'cheerio';
import macros from '../../../macros';
import util from './util';

class PrereqParser {
  /**
   * Figure out coreqs from the stupid html table banner gives us
   * @param html HTML String from banner to parse
   * @param subjectAbbreviationTable info on the subject abbreviations
   */
  serializeCoreqs(html, subjectAbbreviationTable) {
    const $ = cheerio.load(html);
    const table = $('table');
    const rows = util.parseTable(table);
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
    const coreqs = [];
    rows.forEach((row) => {
      const { subject, coursenumber } = row;
      const subjectAbbreviation = _.get(subjectAbbreviationTable, subject, false);
      if (subjectAbbreviation) {
        coreqs.push({
          subject: subjectAbbreviation,
          classId: coursenumber,
        });
      } else {
        macros.warn(`Coreqs: can't find abbreviation for "${subject}"`);
      }
    });

    return {
      type: 'and',
      values: coreqs,
    };
  }

  /**
   * Figure out prereqs from the stupid html table banner gives us
   * @param html HTML String from banner to parse
   * @param subjectAbbreviationTable info on the subject abbreviations
   */
  serializePrereqs(html, subjectAbbreviationTable) {
    const $ = cheerio.load(html);
    const allRows = util.parseTable($('table'));

    let rowIndex = 0;
    function parsePrereqs() {
      const parsed = [];
      let boolean = 'and';
      while (rowIndex < allRows.length) {
        const row = allRows[rowIndex];
        const { subject, coursenumber } = row;
        const leftParen = row[''];
        const rightParen = row['1'];
        const subjectAbbreviation = _.get(subjectAbbreviationTable, subject, false);
        const isContentPresent = (row.subject && row.coursenumber && subjectAbbreviation) || (row.test && row.score);

        if (row['and/or']) {
          boolean = row['and/or'].toLowerCase();
        }

        if (row.subject && !subjectAbbreviation) {
          //TODO rollbar this and other scrape issues
          macros.warn(`Prereqs: can't find abbreviation for "${subject}"`);
        }
        const curr = row.test
          ? row.test
          : ({ classId: coursenumber, subject: subjectAbbreviation });

        rowIndex++;
        if (leftParen) {
          // recur, but then also stick current into the array result of the recur
          const recur = parsePrereqs();
          if (isContentPresent) {
            recur.values.unshift(curr); //push to front
          }
          parsed.push(recur);
        } else if (isContentPresent) {
          // Not left paren, so just push onto current array
          parsed.push(curr);
        }

        if (rightParen) {
          // right paren means this section is done, so early return
          return {
            type: boolean,
            values: parsed,
          };
        }
      }
      return {
        type: boolean,
        values: parsed,
      };
    }
    return parsePrereqs();
  }
}

export default new PrereqParser();
