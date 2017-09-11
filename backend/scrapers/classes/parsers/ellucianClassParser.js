/*
 * Copyright (c) 2017 Ryan Hughes
 *
 * This file is part of CoursePro.
 *
 * CoursePro is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License
 * version 3 as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import URI from 'urijs';
import domutils from 'domutils';
import moment from 'moment';
import he from 'he';
import _ from 'lodash';
import cheerio from 'cheerio';


import cache from '../../cache';
import Request from '../../request';
import macros from '../../../macros';
import EllucianBaseParser from './ellucianBaseParser';
import ellucianSectionParser from './ellucianSectionParser';


const request = new Request('EllucianClassParser');


class EllucianClassParser extends EllucianBaseParser.EllucianBaseParser {


  supportsPage(url) {
    return url.indexOf('bwckctlg.p_disp_listcrse') > -1;
  }


  // Main Entry point. Catalog title is the title of the class on the catalog page.
  // This name is used as a basis for standardizing and cleaning up the names of the sections.
  // See more below.
  async main(url, catalogTitle = null) {
    // Possibly load from DEV
    if (macros.DEV && require.main !== module) {
      const devData = await cache.get('dev_data', this.constructor.name, url);
      if (devData) {
        return devData;
      }
    }

    const resp = await request.get(url);

    // Returns a list of class objects wrapped.
    const { classWrappersMap, sectionStartingDatas } = this.parse(resp.body, url, catalogTitle);

    // Load all the section datas.
    const promises = [];

    for (const sectionStartingData of sectionStartingDatas) {
      // Hit the section page and when it is done, add the section.
      promises.push(this.addSectionData(classWrappersMap, sectionStartingData.value, sectionStartingData.className));
    }

    // Wait for all the sections to finish parsing.
    await Promise.all(promises);

    // Snag just the values of this map to get the class wrapper objects. {value:.. type:... deps:...}
    const classList = Object.values(classWrappersMap);


    // Possibly save to dev
    if (macros.DEV && require.main !== module) {
      await cache.set('dev_data', this.constructor.name, url, classList);

      // Don't log anything because there would just be too much logging.
    }

    return classList;
  }


  // Format is min from midnight, 0 = sunday, 6 = saterday
  // 8:00 am - 9:05 am MWR -> {0:[{start:248309,end:390987}], 1:...}
  parseTimeStamps(times, days) {
    if (times.toLowerCase() === 'tba' || days === '&nbsp;') {
      return null;
    }


    if ((times.match(/m|-/g) || []).length !== 3) {
      macros.log('ERROR: multiple times in times', times, days);
      return null;
    }

    const retVal = {};


    const dayLetterToIndex = {
      U: 0,
      M: 1,
      T: 2,
      W: 3,
      R: 4,
      F: 5,
      S: 6,
    };

    for (let i = 0; i < days.length; i++) {
      const dayIndex = dayLetterToIndex[days[i]];
      if (dayIndex === undefined) {
        macros.log('ERROR: unknown letter ', days, ' !!!');
        return null;
      }

      const timesMatch = times.match(/(.*?) - (.*?)$/i);
      
      let startMoment = moment(timesMatch[1], 'hh:mm a')
      let endMoment = moment(timesMatch[2], 'hh:mm a')

      // Convert the parsed moments to seconds since the day started.
      let start = startMoment.hours() * 60 * 60 + startMoment.minutes() * 60;
      let end = endMoment.hours() * 60 * 60 + endMoment.minutes() * 60;

      if (start < 0 || end < 0 || start > 86400 || end > 86400) {
        macros.error("Error parsing, got invalid times", timesMatch, startMoment, start, end);
      }

      retVal[dayIndex] = [{
        start: start,
        end: end,
      }];
    }
    return retVal;
  }

  async addSectionData(parsedClassMap, sectionStartingData, className) {
    const dataFromSectionPage = await ellucianSectionParser.main(sectionStartingData.url);

    const fullSectiondata = {};

    Object.assign(fullSectiondata, dataFromSectionPage, sectionStartingData);

    if (!parsedClassMap[className]) {
      macros.error('ERROR!', parsedClassMap, className);
      return;
    }

    // Move some attributes to the class pagedata.
    // Run some checks and merge some data into the class object.
    // Actually, because how how this parser adds itself as a dep and copies over attributes,
    // These will log a lot more than they should, just because they are overriding the values that were pre-set on the class
    // Once that is fixed, would recommend re-enabling these.
    // This is fixed now right?????????????
    if (parsedClassMap[className].value.honors !== undefined && parsedClassMap[className].value.honors !== fullSectiondata.honors) {
      macros.log('Overring class honors with section honors...', parsedClassMap[className].value.honors, fullSectiondata.honors, sectionStartingData.url);
    }
    parsedClassMap[className].value.honors = fullSectiondata.honors;
    fullSectiondata.honors = undefined;


    if (fullSectiondata.prereqs) {
      // If they both exists and are different I don't really have a great idea of what to do haha
      // Hopefully this _.isEquals dosen't take too long.
      if (parsedClassMap[className].value.prereqs && !_.isEqual(parsedClassMap[className].value.prereqs, fullSectiondata.prereqs)) {
        macros.log('Overriding class prereqs with section prereqs...', sectionStartingData.url);
      }

      parsedClassMap[className].value.prereqs = fullSectiondata.prereqs;
      fullSectiondata.prereqs = undefined;
    }

    // Do the same thing for coreqs
    if (fullSectiondata.coreqs) {
      if (parsedClassMap[className].value.coreqs && !_.isEqual(parsedClassMap[className].value.coreqs, fullSectiondata.coreqs)) {
        macros.log('Overriding class coreqs with section coreqs...', sectionStartingData.url);
      }

      parsedClassMap[className].value.coreqs = fullSectiondata.coreqs;
      fullSectiondata.coreqs = undefined;
    }


    // Update the max credits on the class if max credits exists on the section and is greater than that on the class
    // Or if the max credits on the class dosen't exist
    if (fullSectiondata.maxCredits !== undefined && (parsedClassMap[className].value.maxCredits === undefined || parsedClassMap[className].value.maxCredits < fullSectiondata.maxCredits)) {
      parsedClassMap[className].value.maxCredits = fullSectiondata.maxCredits;
    }

    // Same thing for min credits, but the sign flipped.
    if (fullSectiondata.minCredits !== undefined && (parsedClassMap[className].value.minCredits === undefined || parsedClassMap[className].value.minCredits > fullSectiondata.minCredits)) {
      parsedClassMap[className].value.minCredits = fullSectiondata.minCredits;
    }


    fullSectiondata.minCredits = undefined;
    fullSectiondata.maxCredits = undefined;


    // Check to make sure there is no room assigned for a class that is online.
    if (fullSectiondata.online && fullSectiondata.meetings) {
      for (const meeting of fullSectiondata.meetings) {
        if (meeting.where !== 'TBA' || meeting.times) {
          macros.log('Online class is set to meet in a room or has times?', fullSectiondata)
        }
      }
    }

    fullSectiondata.lastUpdateTime = Date.now();

    parsedClassMap[className].deps.push({
      type: 'sections',
      value: fullSectiondata,
    });
  }


  // This is called for each section that is found on the page.
  parse(body, url, catalogTitle) {
    const $ = cheerio.load(body);

    const elements = $('body > div.pagebodydiv > table > tr > th.ddtitle > a');

    // Keys are the name of classes. Values are the class objects
    const parsedClassMap = {};

    // Keep track of the starting data for the sections. Keep track of both the name of the class and the data in the sections
    // So they can be matched back up with the classes later.
    const sectionStartingDatas = [];

    // Loop over each one of the elements.
    for (let j = 0; j < elements.length; j++) {
      const element = elements[j].parent.parent;

      // If different name than this class, save to new class
      const sectionStartingData = {};

      // Keep track of the name of this class.
      let className;

      const aElement = elements[j];

      if (!aElement.attribs.href) {
        macros.error('Section does not have a href on class parser?', aElement);
        continue;
      }

      // Find the crn from the url.
      let urlParsed = new URI(he.decode(aElement.attribs.href));

      //add hostname + port if path is relative
      if (urlParsed.is('relative')) {
        const thisPageUrl = new URI(url);
        urlParsed = urlParsed.absoluteTo(`${thisPageUrl.scheme()}://${thisPageUrl.host()}`).toString();
      }

      const sectionURL = urlParsed.toString();

      if (ellucianSectionParser.supportsPage(sectionURL)) {
        sectionStartingData.url = sectionURL;
      } else {
        macros.error('Section parser does not support section url?', sectionURL);
        continue;
      }

      // Add the crn.
      const sectionURLParsed = this.sectionURLtoInfo(sectionURL);
      if (!sectionURLParsed) {
        macros.log('error could not parse section url', sectionURL, url);
        continue;
      }


      // Also parse the name from the link.
      const value = domutils.getText(aElement);

      // Match everything before " - [crn]".
      const match = value.match(`(.+?)\\s-\\s${sectionURLParsed.crn}`, 'i');
      if (!match || match.length < 2) {
        macros.log('could not find title!', match, value);
        continue;
      }

      className = match[1];

      if (className === className.toLowerCase() || className === className.toUpperCase()) {
        macros.log('Warning: class name is all upper or lower case', className, url);
      }

      // Get a list of all class names for the class name fixer.
      let possibleClassNameMatches = [];

      // Add the catalog title
      if (catalogTitle) {
        possibleClassNameMatches.push(catalogTitle);
      }

      // Add the names of all the classes that have already been parsed.
      possibleClassNameMatches = possibleClassNameMatches.concat(Object.keys(parsedClassMap));

      className = this.standardizeClassName(className, possibleClassNameMatches);


      // Setup this new section in the parsedClassMap with the fixed name.
      if (!parsedClassMap[className]) {
        parsedClassMap[className] = {
          type: 'classes',
          value: {
            lastUpdateTime: Date.now(),
            name: className,
            url: url,
            crns: [sectionURLParsed.crn],
          },
          deps: [],
        };
      } else {
        parsedClassMap[className].value.crns.push(sectionURLParsed.crn);
      }

      sectionStartingData.crn = sectionURLParsed.crn;


      // Find the next row.
      let classDetails = element.next;
      while (classDetails.type !== 'tag') {
        classDetails = classDetails.next;
      }

      // Find the table in this section.
      const tables = domutils.getElementsByTagName('table', classDetails);
      if (tables.length !== 1) {
        macros.log(`warning, ${tables.length} meetings tables found`, url);
      }

      if (tables.length > 0) {
        sectionStartingData.meetings = [];

        const { tableData, rowCount } = this.parseTable(tables[0]);

        if (rowCount < 1 || !tableData.daterange || !tableData.where || !tableData.instructors || !tableData.time || !tableData.days) {
          macros.log('ERROR, invalid table in class parser', tableData, url);
          continue;
        }

        for (let i = 0; i < rowCount; i++) {
          sectionStartingData.meetings.push({});
          const index = sectionStartingData.meetings.length - 1;


          // If is a single day class (exams, and some classes that happen like 2x a month specify specific dates).
          const splitTimeString = tableData.daterange[i].split('-');
          if (splitTimeString.length > 1) {
            const startDate = moment(splitTimeString[0].trim(), 'MMM D,YYYY');
            const endDate = moment(splitTimeString[1].trim(), 'MMM D,YYYY');

            if (!startDate.isValid() || !endDate.isValid()) {
              macros.log('ERROR: one of parsed dates is not valid', splitTimeString, url);
            }

            // Add the dates if they are valid.
            // Store as days since epoch 1970.
            if (startDate.isValid()) {
              sectionStartingData.meetings[index].startDate = startDate.diff(0, 'day');
            }

            if (endDate.isValid()) {
              sectionStartingData.meetings[index].endDate = endDate.diff(0, 'day');
            }
          } else {
            macros.log('ERROR, invalid split time string or blank or something', splitTimeString, tableData.daterange[i]);
          }

          // Parse the professors.
          const profs = tableData.instructors[i].split(',');

          profs.forEach((prof) => {
            // Replace double spaces with a single space,trim, and remove the (p) at the end
            prof = prof.replace(/\s+/g, ' ').trim().replace(/\(P\)$/gi, '').trim();

            if (prof.length < 3) {
              macros.log('warning: empty/short prof name??', prof, tableData);
            }
            if (prof.toLowerCase() === 'tba') {
              prof = 'TBA';
            } else {
              prof = this.toTitleCase(prof, url);
            }

            if (!sectionStartingData.meetings[index].profs) {
              sectionStartingData.meetings[index].profs = [];
            }
            sectionStartingData.meetings[index].profs.push(prof);
          });

          // Parse the location.
          sectionStartingData.meetings[index].where = this.toTitleCase(tableData.where[i], url);

          // and the type of meeting (eg, final exam, lecture, etc)
          sectionStartingData.meetings[index].type = this.toTitleCase(tableData.type[i], url);

          // start time and end time of class each day
          const times = this.parseTimeStamps(tableData.time[i], tableData.days[i]);

          // parse and add the times.
          if (times) {
            sectionStartingData.meetings[index].times = times;
          }
        }
      }

      sectionStartingDatas.push({
        value: sectionStartingData,
        className: className,
      });
    }


    // Sort the CRNs in each class.
    // This makes sure that the CRNs will always be in the same order for the given CRNs.
    // (so tests with .equals will work)
    for (const className of Object.keys(parsedClassMap)) {
      parsedClassMap[className].value.crns.sort();
    }

    return {
      classWrappersMap: parsedClassMap,
      sectionStartingDatas: sectionStartingDatas,
    };
  }

  async test() {
    // const output = await this.main('https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=201810&subj_in=ENGW&crse_in=3302&schd_in=LEC');
    const output = await this.main('https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=201810&subj_in=PSYC&crse_in=1101&schd_in=LEC');
    console.log(JSON.stringify(output[0].deps, null, 4))
  }

}


EllucianClassParser.prototype.EllucianClassParser = EllucianClassParser;
const instance = new EllucianClassParser();


if (require.main === module) {
  instance.test();
}


export default instance;
