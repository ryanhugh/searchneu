/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import URI from 'urijs';
import domutils from 'domutils';

import macros from '../../../macros';

class BaseParser {
  supportsPage() {
    macros.error('Base parser supports page was called?');
    return false;
  }


  //returns a {colName:[values]} where colname is the first in the column
  //regardless if its part of the header or the first row of the body
  parseTable(table) {
    if (table.name !== 'table') {
      macros.error('parse table was not given a table..');
      return null;
    }


    //includes both header rows and body rows
    const rows = domutils.getElementsByTagName('tr', table);

    if (rows.length === 0) {
      macros.error('zero rows???');
      return null;
    }


    const retVal = {};
    const heads = [];

    //the headers
    rows[0].children.forEach((element) => {
      if (element.type !== 'tag' || ['th', 'td'].indexOf(element.name) === -1) {
        return;
      }

      const text = domutils.getText(element).trim().toLowerCase().replace(/\s/gi, '');
      retVal[text] = [];
      heads.push(text);
    });


    //add the other rows
    rows.slice(1).forEach((row) => {
      let index = 0;
      row.children.forEach((element) => {
        if (element.type !== 'tag' || ['th', 'td'].indexOf(element.name) === -1) {
          return;
        }
        if (index >= heads.length) {
          macros.log('warning, table row is longer than head, ignoring content', index, heads, rows);
          return;
        }

        retVal[heads[index]].push(domutils.getText(element).trim());

        //only count valid elements, not all row.children
        index++;
      });


      //add empty strings until reached heads length
      for (; index < heads.length; index++) {
        retVal[heads[index]].push('');
      }
    });
    return {
      tableData: retVal,
      rowCount: rows.length - 1,
    };
  }


  //add inputs if they have a value = name:value
  //add all select options if they have multiple
  //add just the first select option if is only 1
  parseForm(url, dom) {
    //find the form, bail if !=1 on the page
    const forms = domutils.getElementsByTagName('form', dom);
    if (forms.length !== 1) {
      macros.error('there is !=1 forms??', forms, url);
      return null;
    }
    const form = forms[0];

    const payloads = [];

    //inputs
    const inputs = domutils.getElementsByTagName('input', form);
    inputs.forEach((input) => {
      if (input.attribs.name === undefined || input.attribs.type === 'checkbox') {
        return;
      }

      if (input.attribs.value === undefined || input.attribs.value === '') {
        input.attribs.value = '';
      }

      payloads.push({
        name: input.attribs.name,
        value: input.attribs.value,
      });
    });


    const selects = domutils.getElementsByTagName('select', form);

    selects.forEach((select) => {
      const options = domutils.getElementsByTagName('option', select);
      if (options.length === 0) {
        macros.log('warning no options in form???', url);
        return;
      }

      //add all of them
      if (select.attribs.multiple !== undefined) {
        options.forEach((option) => {
          const text = domutils.getText(option).trim();

          payloads.push({
            value: option.attribs.value,
            text: text,
            name: select.attribs.name,
          });
        });
      } else {
        // Just add the first select.

        const alts = [];

        options.slice(1).forEach((option) => {
          const text = domutils.getText(option).trim();
          alts.push({
            value: option.attribs.value,
            text: text,
            name: select.attribs.name,
          });
        });

        //get default option
        const text = domutils.getText(options[0]).trim();
        payloads.push({
          value: options[0].attribs.value,
          text: text,
          name: select.attribs.name,
          alts: alts,
        });
      }
    });


    //parse the url, and return the url the post request should go to
    const urlParsed = new URI(url);

    return {
      postURL: `${urlParsed.protocol()}://${urlParsed.host()}${form.attribs.action}`,
      payloads: payloads,
    };
  }


  parseCredits(containsCreditsText) {
    //should match 3.000 Credits  or 1.000 TO 21.000 Credits
    let creditsMatch = containsCreditsText.match(/(?:(\d(:?.\d*)?)\s*to\s*)?(\d+(:?.\d*)?)\s*credit(:?s| hours)/i);
    if (creditsMatch) {
      const maxCredits = parseFloat(creditsMatch[3]);
      let minCredits;

      //sometimes a range is given,
      if (creditsMatch[1]) {
        minCredits = parseFloat(creditsMatch[1]);
      } else {
        minCredits = maxCredits;
      }

      if (minCredits > maxCredits) {
        macros.log('error, min credits>max credits...', containsCreditsText);
        minCredits = maxCredits;
      }

      return {
        minCredits: minCredits,
        maxCredits: maxCredits,
      };
    }


    //Credit Hours: 3.000
    creditsMatch = containsCreditsText.match(/credits?\s*(?:hours?)?:?\s*(\d+(:?.\d*)?)/i);
    if (creditsMatch) {
      const credits = parseFloat(creditsMatch[1]);

      return {
        minCredits: credits,
        maxCredits: credits,
      };
    }

    // 0.800 Continuing Education Units
    creditsMatch = containsCreditsText.match(/(\d+(:?.\d*)?)\s*Continuing\s*Education\s*Units/i);
    if (creditsMatch) {
      const credits = parseFloat(creditsMatch[1]);

      return {
        minCredits: credits,
        maxCredits: credits,
      };
    }


    return null;
  }

  // gets the class type. This is one of:
  // Lecture, Seminar, Lab, Recitation/Discussion, Off-Campus Instruction, Individual Instruction
  parseScheduleType(text) {
    let scheduleType = text.match(/(Schedule Types: )(.*)/i);
    if (scheduleType) {
      scheduleType = scheduleType[2].trim();
    }
    return scheduleType;
  }

  // gets the course Attributes. If course attributes don't exist, return null
  // String -> [Maybe String]
  parseCourseAttr(text) {
    let classAttributes = text.match(/(Course Attributes: \n)(.*)/i);
    if (classAttributes) {
      classAttributes = classAttributes[2].trim().split(', ');
      for (let i = 0; i < classAttributes.length; i++) {
        classAttributes[i] = classAttributes[i].trim();
      }
      return classAttributes;
    }
    return null;
  }


  // http://dan.hersam.com/tools/smart-quotes.html
  simplifySymbols(s) {
    // Codes can be found here:
    // http://en.wikipedia.org/wiki/Windows-1252#Codepage_layout
    s = s.replace(/\u2018|\u2019|\u201A|\uFFFD/g, "'");
    s = s.replace(/\u201c|\u201d|\u201e/g, '"');
    s = s.replace(/\u02C6/g, '^');
    s = s.replace(/\u2039/g, '<');
    s = s.replace(/\u203A/g, '>');
    s = s.replace(/\u2013/g, '-');
    s = s.replace(/\u2014/g, '--');
    s = s.replace(/\u2026/g, '...');
    s = s.replace(/\u00A9/g, '(c)');
    s = s.replace(/\u00AE/g, '(r)');
    s = s.replace(/\u2122/g, 'TM');
    s = s.replace(/\u00BC/g, '1/4');
    s = s.replace(/\u00BD/g, '1/2');
    s = s.replace(/\u00BE/g, '3/4');
    s = s.replace(/[\u02DC|\u00A0]/g, ' ');
    return s;
  }


  // This function cleans up various things in titles during scraping.
  // This is used for college names, professor names, and class location names
  //   - Clean up & simplify some symbols (see simplifySymbols function).
  //   - Replace large gaps of whitespace with 1 space
  //   - Capitalize the A&M in Texas a&m University
  //   - Trim the input string
  // Before, we were using an npm module to automatically fix capitalization issues in titles too,
  // but these libraries ended up messing up the capitalization for more titles than they were fixing
  // So we removed the automatic-capitalization and just stuck with some basic string functionality.
  // NPM modules we looked at:
  // https://www.npmjs.com/package/case
  // https://www.npmjs.com/package/change-case
  // https://www.npmjs.com/package/slang
  // https://www.npmjs.com/package/to-title-case
  toTitleCase(originalString, warningStr) {
    if (originalString === 'TBA') {
      return originalString;
    }

    if (originalString.toLowerCase() === originalString || originalString.toUpperCase() === originalString) {
      macros.log('Warning: originalString is all upper or all lower case', originalString, warningStr);
    }


    let string = this.simplifySymbols(originalString);

    // Get rid of newlines and replace large sections of whitespace with one space.
    string = string.replace(/\n/g, ' ').replace(/\r/g, ' ').replace(/\s+/g, ' ');

    const correctParts = [
      // Capitalize the A&M in Texas A&M University ("Texas a&m University" -> "Texas A&M University")
      ' A&M ',
    ];

    correctParts.forEach((subString) => {
      string = string.replace(new RegExp(subString, 'gi'), subString);
    });

    string = string.trim();

    if (string !== originalString.trim()) {
      macros.log('Warning: changing from ', originalString, 'to', string, 'at', warningStr);
    }

    return string.trim();
  }

  // This function is used as part of standardizeClassName.
  // This function will remove endings off the end of a given string
  // and return the remaining string and a list of all the endings
  // These indings include "- Lab" and (HON).
  // These endings can sometimes appear on a few sections of classes that tend to have many sections
  // Eg. 5 normal sections and 1 honors section: The honors section would have an (HON) at the end.
  // 'something something (hon)' -> 'something something' and ['(hon)']
  splitEndings(name) {
    name = name.trim();

    const endings = [];
    // --Lab at the end is also an ending
    const match = name.match(/-+\s*[\w\d]+$/i);
    if (match) {
      let dashEnding = match[0];

      //remove it from name
      name = name.slice(0, name.indexOf(dashEnding)).trim();

      // standardize to one dash
      while (dashEnding.startsWith('-')) {
        dashEnding = dashEnding.slice(1).trim();
      }

      endings.push(`- ${dashEnding.trim()}`);
    }

    // remove things in parens at the end
    // Intro to the Study Engr (hon)
    while (name.endsWith(')')) {
      //find the name at the end
      const parenNameMatch = name.match(/\([\w\d]+\)$/i);
      if (!parenNameMatch) {
        break;
      }

      let subString = parenNameMatch[0];

      if (!name.endsWith(subString)) {
        macros.log('Warning: string dosent end with match??', name, subString);
        break;
      }

      // remove the endings
      name = name.slice(0, name.indexOf(subString)).trim();

      if (subString.length <= 5) {
        subString = subString.toLowerCase();
      }

      endings.push(subString);
    }
    return {
      name: name,
      endings: endings,
    };
  }


  // fixes a class name based on others that it could be an abbriation of
  // also cleans up whitespace and odd characters

  // dosent work for
  // https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?schd_in=%25&term_in=201710&subj_in=JRNL&crse_in=1150
  // Interpreting the Day’s News vs Interptng the Day's News
  // or this https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=201810&subj_in=BUSN&crse_in=1103&schd_in=LEC

  // If no possibleMatches are given, just fix small bugs.
  // EllucianCategoryParser will not pass in possibleMawtches.
  standardizeClassName(originalName, possibleMatches = []) {
    // Trim all inputs and replace 2+ spaces for 1
    originalName = originalName.trim().replace(/\s+/gi, ' ');
    originalName = this.simplifySymbols(originalName);

    if (originalName.lenght === 0) {
      macros.log('Warning: originalName was empty or had only symbols');
      if (possibleMatches.length === 0) {
        macros.error('Dont have a name for a class!', originalName, possibleMatches);
        return 'Unknown class';
      }

      return possibleMatches[0];
    }

    for (let i = 0; i < possibleMatches.length; i++) {
      possibleMatches[i] = possibleMatches[i].trim().replace(/\s+/gi, ' ');
      possibleMatches[i] = this.simplifySymbols(possibleMatches[i]);
    }


    let name = originalName;

    const nameSplit = this.splitEndings(name);
    name = nameSplit.name;
    const endings = nameSplit.endings;

    // if input is in possible matches, done
    if (possibleMatches.includes(originalName) || possibleMatches.length === 0) {
      return (`${name} ${endings.join(' ')}`).trim();
    }


    // remove symbols and whitespace, just for comparing
    // ok to mess with name from here on out,
    // but might return originalName or possibleMatch so don't mess with them
    name = name.replace(/[^0-9a-zA-Z]/gi, '');


    // see if name is an abbrivation of the possible matches
    // eg "phys for engrs" = "Physics for Engineers"
    for (let i = 0; i < possibleMatches.length; i++) {
      let possibleMatch = this.splitEndings(possibleMatches[i]).name;

      // loop through possibleMatch and name at the same time
      // and when a character matches, continue.
      // if name is an in-order subset of possible match the nameIndex will be name.length at the end
      let nameIndex = 0;
      for (let matchIndex = 0; matchIndex < possibleMatch.length; matchIndex++) {
        // done!
        if (nameIndex >= name.length) {
          break;
        }

        if (possibleMatch[matchIndex].toLowerCase() === name[nameIndex].toLowerCase()) {
          nameIndex++;
        }
      }


      // huzzah! a match!
      if (nameIndex === name.length) {
        // add the endings back on, but only if possible match dosent include them
        for (let j = 0; j < endings.length; j++) {
          if (!possibleMatch.includes(endings[j])) {
            possibleMatch += ` ${endings[j]}`;
            possibleMatch = possibleMatch.trim();
          }
        }

        return possibleMatch;
      }
    }
    return originalName;
  }


  getOptionallyPlural(num) {
    if (num === 1) {
      return '';
    }
    return 's';
  }
}


BaseParser.prototype.BaseParser = BaseParser;
export default new BaseParser();
