/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */


import domutils from 'domutils';
import he from 'he';
import URI from 'urijs';

import macros from '../../../macros';
import EllucianBaseParser from './ellucianBaseParser';

// This file parses the Prequisites and Corequisites section on the section and catalog page. This code is used from both EllucianCatalogParser.js and
// EllucianSectionParser.js. Some of these Strings are pretty simple, like this

// (Undergraduate Semester level ME 2801 Minimum Grade of D or Undergraduate Semester level AE 2220 Minimum Grade of D) and Undergraduate Semester level ME 2016 Minimum Grade of D
// (where the ME 2801 and AE 2220 would be hyperlinked)


// And some are way more complicated. This file uses a AST (https://en.wikipedia.org/wiki/Abstract_syntax_tree) to parse them. This is very similar to how programming languages and
// math equations (eg x*y+2/(z*2)) are parsed. It outputs a reasonable JSON structure (see unit tests in tests/EllucianRequisitesParser.tests.js)

// I originally wrote this in Aug 2015, and re wrote it in Oct 2016 and did it totally differently.

// However, sometimes the school's websites have invalid or inconsistent prereq string.

// Here is an example of one with more closing parens than opening parens. The extra closing parens are ignored.
// https://lewisweb.cc.lehigh.edu/PROD/bwckctlg.p_disp_course_detail?cat_term_in=201640&subj_code_in=ISE&crse_numb_in=251
// https://lewisweb.cc.lehigh.edu/PROD/bwckctlg.p_disp_course_detail?cat_term_in=201640&subj_code_in=ISE&crse_numb_in=251
// https://lewisweb.cc.lehigh.edu/PROD/bwckctlg.p_disp_course_detail?cat_term_in=201620&subj_code_in=ISE&crse_numb_in=251
// (Undergraduate level ISE 121 Minimum Grade of TR or Undergraduate level IE 121 Minimum Grade of TR) and ( (Undergraduate level ISE 220 Minimum Grade of TR or Undergraduate level IE 220 Minimum Grade of TR) ) ) or ( (Undergraduate level ISE 230 Minimum Grade of TR or Undergraduate level IE 230 Minimum Grade of TR) and (Undergraduate level ISE 240 Minimum Grade of TR or Undergraduate level IE 240 Minimum Grade of TR) ) )

// Other times, it will not be grouped by parens, eg [a or b and c or d], and it is not clear what the options are, even when reading them by hand.
// (Should the order of operations be applied? Did they make a typo and the "and" should have been an or?)
// There were 4 occurrences of this at NEU, but more at other colleges. GATECH had 876/25261 (3.5%) classes like this. 363 of them parsed something different than the old parser.
// The old parser grouped these by order of operations. This one assumes that the last divider at a given level is correct.
// https://oscar.gatech.edu/pls/bprod/bwckschd.p_disp_detail_sched?term_in=201602&crn_in=29120
// https://oscar.gatech.edu/pls/bprod/bwckschd.p_disp_detail_sched?term_in=201702&crn_in=26627
// https://oscar.gatech.edu/pls/bprod/bwckschd.p_disp_detail_sched?term_in=201702&crn_in=25982
// https://oscar.gatech.edu/pls/bprod/bwckschd.p_disp_detail_sched?term_in=201602&crn_in=24775

// Once it is known for sure how to handle this, the new parser will be updated and the old one will be removed.
// eg https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201730&crn_in=35984

class EllucianRequisitesParser extends EllucianBaseParser.EllucianBaseParser {
  // This entire process is synchronous, so keep track of the intermediary values here.
  constructor() {
    super();

    // The current url of the page that is being parsed.
    // Used for normalizing URLs and is logged if this code errors.
    this.currentUrl = null;

    // The current buffer of characters to be parsed.
    // This will be an array of bufferItems, such that a buffer can be:
    // {type:'char',value:'a'} <-- any character
    // {type:'element',name:'a',href:'https://...'}
    // {type:'element',name:'br'}
    this.buffer = null;

    this.parentFrames = null;

    // Null when not parsing.
    // {type:'and'|'or',values:[...]}
    this.currFrame = null;

    // Keeps track of whether an error has been encounterd while processing.
    // This invalid input - invalid syntax or ambigious input (eg (a or b and c or d - ambigious and/or grouping) or ( a b and c or d e - missing and/or))
    // If an error is hit, it returns "Error while processing prereqs" and logs and error to rollbar
    this.error = null;
  }


  //this is given the output of formatRequirements, where data.type and data.values exist
  // if there is an or embedded in another or, merge them (and and's too)
  //and if there is a subvalue of only 1 len, merge that too
  simplifyRequirementsBase(data) {
    if ((typeof data) === 'string') {
      return data;
    }

    if (data.subject && data.classId) {
      return data;
    }

    // Must have .values and .type from here on
    const retVal = {
      type: data.type,
      values: [],
    };

    // Simplify all children
    data.values.forEach((subData) => {
      subData = this.simplifyRequirementsBase(subData);

      if (subData.type && subData.values) {
        //if same type, merge
        if (subData.type === data.type) {
          retVal.values = retVal.values.concat(subData.values);
          return;

        // If only contains 1 value, merge
        }

        if (subData.values.length === 1) {
          retVal.values.push(subData.values[0]);
          return;
        }
      }

      //just add the subdata
      retVal.values.push(subData);
    });

    // Simplify this node
    if (retVal.values.length === 1) {
      return retVal.values[0];
    }

    return retVal;
  }


  simplifyRequirements(data) {
    data = this.simplifyRequirementsBase(data);
    if (!data.values || !data.type) {
      return {
        type: 'and',
        values: [data],
      };
    }

    return data;
  }

  getLogString(message) {
    // Log to elog with url from this.currentUrl, divider, currFrame, a a good way to display the next 10 or so char from the buffer

    message = [message, ' '];
    for (let i = 0; i < Math.min(this.buffer.length, 10); i++) {
      const bufferItem = this.buffer[i];
      if (bufferItem.type === 'char') {
        message.push(bufferItem.value);
      } else if (bufferItem.type === 'element') {
        message.push(`<${bufferItem.name}`);
        if (bufferItem.href) {
          message.push(' ');
          message.push(bufferItem.href);
        }
        message.push('>');
      }
    }

    message = message.join('');

    let url;
    if (this.currentUrl) {
      url = this.currentUrl;
    }
    return [message, url, this.currFrame];
  }


  logError(message) {
    macros.warn(...this.getLogString(message));
    this.error = true;
  }


  // logError(message) {
  //   macros.error(...this.getLogString(message));
  // }


  // Start of the parsing functions. These will return false if they should not parse the start of the buffer.
  // The order they are ran is determed below.


  bufferStartsWith(string) {
    if (this.buffer.length < string.length) {
      return false;
    }

    for (let i = 0; i < string.length; i++) {
      if (this.buffer[i].value !== string[i]) {
        return false;
      }
    }
    return true;
  }


  findDivider() {
    if (this.buffer[0].type === 'element' && this.buffer[0].name === 'br') {
      return {
        type: 'and',
        length: 1,
      };
    }

    if (this.bufferStartsWith(' or ')) {
      return {
        type: 'or',
        length: 4,
      };
    }

    if (this.bufferStartsWith(' and ')) {
      return {
        type: 'and',
        length: 5,
      };
    }

    return null;
  }

  // Divider shall be 'or' or 'and'
  // This will match ' or ', ' and ', and <br> in the buffer. If a <br> is encountered, the type is set to and.
  parseDivider() {
    const dividerObj = this.findDivider();

    if (!dividerObj) {
      return false;
    }

    if (this.currFrame.type && this.currFrame.type !== dividerObj.type) {
      this.logError(`Mismatched types. divider=${this.currFrame.type}:${dividerObj.type}`);
      return true;
    }

    this.buffer.splice(0, dividerObj.length);
    this.currFrame.type = dividerObj.type;
    return true;
  }


  // Should parse string returns true for any character or for a <a>


  // Can return three different things:
  // 1. {termId:subject:classId:} object with the details of another class
  // 2. "AP Test string" a string
  // 3. null. In this case, nothing should be added to the output

  parseString() {
    if (this.buffer[0].type !== 'char' && !(this.buffer[0].type === 'element' && this.buffer[0].name === 'a')) {
      return false;
    }

    let numOpenParens = 0;
    const retVal = [];
    let classInfo;

    while (this.buffer.length > 0 && !this.findDivider()) {
      if (this.buffer[0].type === 'char') {
        if (this.buffer[0].value === ')') {
          if (numOpenParens === 0) {
            break;
          } else {
            retVal.push(')');
            numOpenParens--;
          }
        } else if (this.buffer[0].value === '(') {
          numOpenParens++;
          retVal.push('(');
        } else {
          retVal.push(this.buffer[0].value);
        }
      } else if (this.buffer[0].type === 'element') {
        if (this.buffer[0].name === 'a') {
          // Find the full URL.
          const classListUrl = new URI(he.decode(this.buffer[0].href)).absoluteTo(this.currentUrl).toString();

          // Get the {subject:classId:}.
          const currClassInfo = this.classListURLtoClassInfo(classListUrl);

          if (currClassInfo) {
            if (classInfo) {
              this.logError(`Two urls found in one string?${JSON.stringify(classInfo)}${JSON.stringify(currClassInfo)}`);
              // Error out.
              return true;
            }
            classInfo = currClassInfo;
          }
        } else {
          this.logError(`Unknown element in parseString:${this.buffer[0].name}`);
          return true;
        }
      } else {
        this.logError(`Unknown buffer type in parseString:${this.buffer[0].type}`);
        return true;
      }
      this.buffer.shift();
    }
    if (classInfo) {
      this.currFrame.values.push({
        classId: classInfo.classId,
        subject: classInfo.subject,
      });
    } else {
      const text = retVal.join('').trim();
      if (!text.match(/\s*Pre-?req for \w+\s*[\d\w]+\s*\d+\s*$/gi) && text.length > 0) {
        this.currFrame.values.push(text);
      }
    }
    return true;
  }

  parseOpenParen() {
    if (!(this.buffer[0].type === 'char' && this.buffer[0].value === '(')) {
      return false;
    }

    this.parentFrames.push(this.currFrame);
    const parentValue = this.currFrame;
    this.currFrame = {
      type: null,
      values: [],
    };
    parentValue.values.push(this.currFrame);
    this.buffer.shift();
    return true;
  }


  parseCloseParen() {
    if (!(this.buffer[0].type === 'char' && this.buffer[0].value === ')')) {
      return false;
    }

    const newFrame = this.parentFrames.pop();
    if (newFrame) {
      this.currFrame = newFrame;
    }
    this.buffer.shift();
    return true;
  }

  // This was a fix for a bug where if there were two open parens and a space between them, it would start parsing a string when it hit the space
  // so the second open paren would be parsed as part of the string, instead of a open paren.
  parseSpace() {
    if (!(this.buffer[0].type === 'char' && this.buffer[0].value === ' ')) {
      return false;
    }

    this.buffer.shift();
    return true;
  }


  // This is the main control function as part of the parser.
  // Each parsing function is responsible for removing the chunk that it parsed from the buffer.
  // and modifying this.currFrame accordingly.
  // Only parseOpenParen and parseCloseParen modify this.parentFrames
  // When any of them matches something, start from the beginning again.
  parse() {
    while (this.buffer.length > 0 && !this.error) {
      if (this.parseOpenParen()) {
        continue;
      } else if (this.parseCloseParen()) {
        continue;
      } else if (this.parseDivider()) {
        continue;
      } else if (this.parseSpace()) {
        continue;
      } else if (this.parseString()) {
        continue;
      } else {
        this.logError('No parser matched?');
        this.buffer.shift();
      }
    }

    if (this.error) {
      return null;
    }


    if (!this.currFrame.type && this.currFrame.values.length === 1 && this.currFrame.values[0].type && this.currFrame.values[0].values) {
      return this.currFrame.values[0];
    }

    if (!this.currFrame.type) {
      if (!this.currFrame.values.length < 2) {
        this.currFrame.type = 'and';
      } else {
        macros.error(this.currFrame);
      }
    }


    return this.currFrame;
  }

  convertElementListToWideMode(elements) {
    const retVal = [];

    elements.forEach((element) => {
      if (element.type === 'text') {
        // Replace repeated spaces with a single space.
        const text = domutils.getText(element).replace(/\s+|\n|\r/gi, ' ');
        text.split('').forEach((char) => {
          retVal.push({
            type: 'char',
            value: char,
          });
        });
      } else if (element.type === 'tag') {
        if (element.name === 'br') {
          retVal.push({
            type: 'element',
            name: element.name,
          });
        } else if (element.name === 'a') {
          retVal.push({
            type: 'element',
            name: element.name,
            href: element.attribs.href,
          });
        } else {
          macros.error('Skipping unknown element', element.name);
        }
      } else {
        macros.error('Skipping unknown type:', element.type);
      }
    });

    // Strip leading and trailing BRs and whitespace.
    while (retVal.length > 0) {
      if (retVal[0].type === 'element' && retVal[0].name === 'br') {
        retVal.shift();
      } else if (retVal[0].type === 'char' && retVal[0].value.trim() === '') {
        retVal.shift();
      } else {
        break;
      }
    }

    while (retVal.length > 0) {
      if (retVal[retVal.length - 1].type === 'element' && retVal[retVal.length - 1].name === 'br') {
        retVal.pop();
      } else if (retVal[retVal.length - 1].type === 'char' && retVal[retVal.length - 1].value.trim() === '') {
        retVal.pop();
      } else {
        break;
      }
    }

    return retVal;
  }


  // Class details should be a list of dom elements
  // sectionName should be either 'prerequisites' or 'corequisites'
  // This function will find all elements in the given section from a part of the dom where the section we are looking for are on the top part
  findRequisitesSection(classDetails, sectionName) {
    const elements = [];
    let i = 0;
    sectionName = sectionName.toLowerCase();

    //skip all elements until the section
    for (; i < classDetails.length; i++) {
      if (classDetails[i].type === 'tag' && domutils.getText(classDetails[i]).trim().toLowerCase().includes(sectionName)) {
        break;
      }
    }
    i++;

    //add all text/elements until next element
    for (; i < classDetails.length; i++) {
      if (classDetails[i].type === 'tag') {
        if (classDetails[i].name === 'br') {
          elements.push(classDetails[i]);
          continue;
        } else if (classDetails[i].name === 'a') {
          const elementText = domutils.getText(classDetails[i]);
          if (elementText.trim() === '') {
            macros.verbose('warning, not matching ', sectionName, ' with no text in the link', this.currentUrl);
            continue;
          }

          let classListUrl = he.decode(classDetails[i].attribs.href);
          if (!classListUrl || classListUrl === '') {
            macros.log('error could not get classListUrl', classListUrl, classDetails[i].attribs, this.currentUrl);
            continue;
          }

          classListUrl = new URI(classListUrl).absoluteTo(this.currentUrl).toString();
          if (!classListUrl) {
            macros.log('error could not find classListUrl url', classListUrl, classDetails[i], classDetails[i].attribs.href);
            continue;
          }

          elements.push(classDetails[i]);
          continue;
        } else {
          break;
        }
      } else {
        elements.push(classDetails[i]);
      }
    }

    return elements;
  }


  init(url) {
    if (this.currentUrl) {
      macros.error('Already have a currentUrl in EllucianRequisitesParser.');
    }

    if (this.buffer) {
      macros.error('Already have a buffer in EllucianRequisitesParser');
    }
    this.currentUrl = url;
    this.buffer = [];
    this.parentFrames = [];
    this.error = null;

    // Keep track of the current list of groups being parsed.
    // This stack does not include the current group being parsed, which is kept track in retVal.
    this.currFrame = {
      type: null,
      values: [],
    };
  }


  finish() {
    this.currentUrl = null;
    this.buffer = null;
    this.parentFrames = null;
    this.currFrame = null;
    this.error = null;
  }


  parseRequirementSection(url, classDetails, sectionName) {
    this.init(url);

    const elements = this.findRequisitesSection(classDetails, sectionName);

    if (elements.length === 0) {
      this.finish();
      return null;
    }

    this.buffer = this.convertElementListToWideMode(elements);

    let retVal = this.parse();

    if (this.error) {
      this.finish();
      return {
        type: 'and',
        values: [`Error while parsing ${sectionName}.`],
      };
    }


    retVal = this.simplifyRequirements(retVal);

    this.finish();

    if (retVal.values.length === 0) {
      return null;
    }

    return retVal;
  }


  test() {

  }
}

//this allows subclassing, http://bites.goodeggs.com/posts/export-this/ (Mongoose section)
EllucianRequisitesParser.prototype.EllucianRequisitesParser = EllucianRequisitesParser;
const instance = new EllucianRequisitesParser();

if (require.main === module) {
  instance.test();
}


export default instance;
