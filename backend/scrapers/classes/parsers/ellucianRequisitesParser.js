/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import domutils from 'domutils';
import he from 'he';
import URI from 'urijs';

import macros from '../../../macros';
import EllucianBaseParser from './ellucianBaseParser';

// This is the old requisite parser. See ellucianRequisiteParser2.js for the new one.
// Right now both run every time a requisite section is parsed. The new one supports mismatched parens and this one does not.

class EllucianRequisitesParser extends EllucianBaseParser.EllucianBaseParser {
  //follow the order of operations (and before or)
  //and group a (something and something or something) to ((something and something) or something)
  //unnecesary groupings are undone by simplifyRequirements
  groupRequirementsByAnd(data) {
    const retVal = [];

    for (let i = 0; i < data.length; i++) {
      if (i + 2 >= data.length) {
        retVal.push(data[i]);
        continue;
      }

      if (data[i + 1] === 'and' && data.length > 3) {
        let beforeAnd;
        if (Array.isArray(data[i])) {
          beforeAnd = this.groupRequirementsByAnd(data[i]);
        } else {
          beforeAnd = data[i];
        }

        let afterAnd;
        if (Array.isArray(data[i + 2])) {
          afterAnd = this.groupRequirementsByAnd(data[i + 2]);
        } else {
          afterAnd = data[i + 2];
        }

        retVal.push([beforeAnd, 'and', afterAnd]);
        i += 2;
        continue;
      } else {
        retVal.push(data[i]);
      }
    }
    return retVal;
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
        }

        // If only contains 1 value, merge
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


  //converts the ['','and',''] to {type:and,values:'',''}
  formatRequirements(data) {
    const retVal = {
      type: 'and',
      values: [],
    };

    data.forEach((val, index) => {
      if (Array.isArray(val)) {
        const subValues = this.formatRequirements(val);

        //found another array, convert sub array and add it to retval
        if (!subValues) {
          macros.log('warning could not parse sub values', data, val);
        } else {
          retVal.values.push(subValues);
        }
      } else if (val === 'or' || val === 'and') {
        if (index === 0) {
          macros.log('warning, divider found at index 0??', data);
        }
        retVal.type = val;
      } else {
        retVal.values.push(val);
      }
    });

    if (retVal.values.length === 0) {
      return null;
    }

    return retVal;
  }


  //splits a string by and/or and to json string (uparsed)
  convertStringToJSON(text) {
    text = text.replace(/[\n\r\s]+/gi, ' ');

    const elements = [];

    //split the string by dividers " and " and " or "
    text.split(' or ').forEach((splitByOr, index, arr) => {
      splitByOr.split(' and ').forEach((splitByAnd, innerIndex, innerArray) => {
        elements.push(splitByAnd);
        if (innerIndex !== innerArray.length - 1) {
          elements.push('and');
        }
      });

      if (index !== arr.length - 1) {
        elements.push('or');
      }
    });

    const retVal = [];

    //convert the elements to a json parsable string
    //each element has quotes put around it, and comma after it
    elements.forEach((element) => {
      //just put quotes around the dividers
      if (element === 'and' || element === 'or') {
        retVal.push(`"${element}",`);
        return;
      }
      element = element.trim();

      //all of the grouping parens will be at end or start of element string
      while (element.startsWith('(')) {
        element = element.slice(1).trim();
        retVal.push('[');
      }

      //ending bracket needs to be checked here, but inserted after url/text parsed
      // https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201615&subj_code_in=BTC&crse_numb_in=6213
      let endBracketToInsertCount = 0;
      while (element.endsWith(')')) {
        element = element.slice(0, element.length - 1).trim();
        endBracketToInsertCount++;
      }


      //match the url if it is there
      const match = element.match(/@#\$"(.*?)"/i);
      if (element.includes('@#$') && match) {
        retVal.push(`"@#$${match[1]}",`);

      // Just add all of the text.
      } else {
        retVal.push(`"${element.trim()}",`);
      }

      for (let i = 0; i < endBracketToInsertCount; i++) {
        retVal.push('],');
      }
    });

    //clean up invalid syntax
    let retValText = `[${retVal.join('')}]`;
    retValText = retValText.replace(/,\]/gi, ']').replace(/\[,/gi, '[').replace(/",+"/gi, '","').replace(/\n|\r/gi, '');

    return retValText;
  }

  removeBlacklistedStrings(data) {
    if (!data.values) {
      macros.log('js error need values in removeBlacklistedStrings');
      return data;
    }

    const newValues = [];

    data.values.forEach((subData) => {
      if ((typeof subData) === 'string') {
        if (!subData.match(/\s*Pre-?req for \w+\s*[\d\w]+\s*\d+\s*$/gi)) {
          newValues.push(subData);
        }
      } else {
        newValues.push(this.removeBlacklistedStrings(subData));
      }
    });

    data.values = newValues;

    return data;
  }

  convertClassListURLs(url, data) {
    if ((typeof data) === 'string') {
      //urls will start with this
      if (data.startsWith('@#$')) {
        const classInfo = this.classListURLtoClassInfo(data.slice(3));
        if (!classInfo) {
          macros.log('error thought was url, but wasent', data);
          return data;
        }

        //don't need to keep termId if its the same as this class
        // if (classInfo.termId === url) {
        delete classInfo.termId;
        // };


        return classInfo;
      }

      return data;
    }

    data.values.forEach((subData, index) => {
      data.values[index] = this.convertClassListURLs(url, subData);
    });
    return data;
  }


  parseRequirementSection(url, classDetails, sectionName) {
    const elements = [];
    let i = 0;

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
          if (elements.length > 0) {
            elements.push(' and ');
          }
          continue;
        } else if (classDetails[i].name === 'a') {
          const elementText = domutils.getText(classDetails[i]);
          if (elementText.trim() === '') {
            macros.verbose('warning, not matching ', sectionName, ' with no text in the link', url);
            continue;
          }

          let classListUrl = he.decode(classDetails[i].attribs.href);
          if (!classListUrl || classListUrl === '') {
            macros.log('error could not get classListUrl', classListUrl, classDetails[i].attribs, url);
            continue;
          }

          classListUrl = new URI(classListUrl).absoluteTo(url).toString();
          if (!classListUrl) {
            macros.log('error could not find classListUrl url', classListUrl, classDetails[i], classDetails[i].attribs.href);
            continue;
          }

          elements.push(`@#$"${classListUrl}"`);
        } else {
          break;
        }
      } else {
        let urlText = domutils.getOuterHTML(classDetails[i]);
        urlText = urlText.replace(/\n|\r|\s/gi, ' ').replace(/\s+/gi, ' ');
        if (urlText === '' || urlText === ' ') {
          continue;
        }
        if (urlText.includes('@#$')) {
          macros.log('warning @#$ used to designate url was found in string?!?', url);
          urlText = urlText.replace(/@#\$/gi, '');
        }
        elements.push(urlText);
      }
    }

    // Remove all the 'and's from the end that were added from replacing BRs
    for (let j = elements.length - 1; j >= 0; j--) {
      if (elements[j] === ' and ') {
        elements.splice(j);
      } else {
        break;
      }
    }

    //no section given, or invalid section, or page does not list any pre/co reqs
    if (elements.length === 0) {
      return null;
    }

    // macros.log(elements);

    let text = elements.join('').trim();
    if (text === '') {
      macros.log('warning, found elements, but no links or and or', elements);
      return null;
    }
    text = this.convertStringToJSON(text);

    //parse the new json
    try {
      text = JSON.parse(text);
    } catch (err) {
      //maybe there are more starting than ending...
      const openingBrackedCount = (text.match(/\[/g) || []).length;
      const closingBrackedCount = (text.match(/\]/g) || []).length;

      if (openingBrackedCount > closingBrackedCount && text.startsWith('[')) {
        text = text.slice(1);
        try {
          text = JSON.parse(text);
        } catch (innerError) {
          macros.log('error, tried to remove [ from beginning, didnt work', text, elements, innerError);
          return null;
        }
      } else if (closingBrackedCount > openingBrackedCount && text.endsWith(']')) {
        text = text.slice(0, text.length - 1);
        try {
          text = JSON.parse(text);
        } catch (innerError) {
          macros.log('error, tried to remove ] from end, didnt work', text, elements, innerError);
          return null;
        }
      } else {
        macros.log('ERROR: unabled to parse formed json string', err, text, elements, url);
        return null;
      }
    }

    if (text.length === 1 && Array.isArray(text[0])) {
      text = text[0];
    }


    text = this.groupRequirementsByAnd(text);

    text = this.formatRequirements(text);
    if (!text) {
      macros.log('error formatting requirements, ', url, elements);
      return null;
    }
    text = this.removeBlacklistedStrings(text);
    text = this.simplifyRequirements(text);
    text = this.convertClassListURLs(url, text);

    return text;
  }
}


//this allows subclassing, http://bites.goodeggs.com/posts/export-this/ (Mongoose section)
EllucianRequisitesParser.prototype.EllucianRequisitesParser = EllucianRequisitesParser;
const instance = new EllucianRequisitesParser();

if (require.main === module) {
  // instance.tests();
}

export default instance;
