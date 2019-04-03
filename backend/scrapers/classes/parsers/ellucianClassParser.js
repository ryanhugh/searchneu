/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
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
      const devData = await cache.get(macros.DEV_DATA_DIR, this.constructor.name, url);
      if (devData) {
        return devData;
      }
    }

    const resp = await request.get(url);

    // Returns a list of class objects wrapped.
    const { classWrapper, sectionStartingDatas } = this.parse(resp.body, url, catalogTitle);

    // Load all the section datas.
    const promises = [];

    for (const sectionStartingData of sectionStartingDatas) {
      // Hit the section page and when it is done, add the section.
      promises.push(this.addSectionData(classWrapper, sectionStartingData));
    }

    // Wait for all the sections to finish parsing.
    await Promise.all(promises);


    // Possibly save to dev
    if (macros.DEV && require.main !== module) {
      await cache.set(macros.DEV_DATA_DIR, this.constructor.name, url, classWrapper);

      // Don't log anything because there would just be too much logging.
    }

    return classWrapper;
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

      const startMoment = moment(timesMatch[1], 'hh:mm a');
      const endMoment = moment(timesMatch[2], 'hh:mm a');

      // Convert the parsed moments to seconds since the day started.
      const start = startMoment.hours() * 60 * 60 + startMoment.minutes() * 60;
      const end = endMoment.hours() * 60 * 60 + endMoment.minutes() * 60;

      if (start < 0 || end < 0 || start > 86400 || end > 86400) {
        macros.error('Error parsing, got invalid times', timesMatch, startMoment, start, end);
      }

      retVal[dayIndex] = [{
        start: start,
        end: end,
      }];
    }
    return retVal;
  }

  async addSectionData(classWrapper, sectionStartingData) {
    const dataFromSectionPage = await ellucianSectionParser.main(sectionStartingData.url);

    const fullSectiondata = {};

    // Some of the data that we want on the section object is parsed from this page.
    // This is where we merge it into the data from the section parser.
    Object.assign(fullSectiondata, dataFromSectionPage, sectionStartingData);


    // Run some checks and merge some data into the class object.
    if (fullSectiondata.prereqs) {
      // If they both exists and are different I don't really have a great idea of what to do haha
      // Hopefully this _.isEquals dosen't take too long.
      if (classWrapper.value.prereqs && !_.isEqual(classWrapper.value.prereqs, fullSectiondata.prereqs)) {
        macros.log('Overriding class prereqs with section prereqs...', sectionStartingData.url);
      }

      classWrapper.value.prereqs = fullSectiondata.prereqs;
      fullSectiondata.prereqs = undefined;
    }

    // Do the same thing for coreqs
    if (fullSectiondata.coreqs) {
      if (classWrapper.value.coreqs && !_.isEqual(classWrapper.value.coreqs, fullSectiondata.coreqs)) {
        macros.log('Overriding class coreqs with section coreqs...', sectionStartingData.url);
      }

      classWrapper.value.coreqs = fullSectiondata.coreqs;
      fullSectiondata.coreqs = undefined;
    }


    // Update the max credits on the class if max credits exists on the section and is greater than that on the class
    // Or if the max credits on the class dosen't exist
    if (fullSectiondata.maxCredits !== undefined && (classWrapper.value.maxCredits === undefined || classWrapper.value.maxCredits < fullSectiondata.maxCredits)) {
      classWrapper.value.maxCredits = fullSectiondata.maxCredits;
    }

    // Same thing for min credits, but the sign flipped.
    if (fullSectiondata.minCredits !== undefined && (classWrapper.value.minCredits === undefined || classWrapper.value.minCredits > fullSectiondata.minCredits)) {
      classWrapper.value.minCredits = fullSectiondata.minCredits;
    }


    fullSectiondata.minCredits = undefined;
    fullSectiondata.maxCredits = undefined;


    classWrapper.value.feeDescription = fullSectiondata.feeDescription;
    classWrapper.value.feeAmount = fullSectiondata.feeAmount;
    fullSectiondata.feeDescription = undefined;
    fullSectiondata.feeAmount = undefined;


    // Check to make sure there is no room assigned for a class that is online.
    if (fullSectiondata.online && fullSectiondata.meetings) {
      for (const meeting of fullSectiondata.meetings) {
        if (meeting.where !== 'TBA' || meeting.times) {
          macros.log('Online class is set to meet in a room or has times?', fullSectiondata);
        }
      }
    }

    fullSectiondata.lastUpdateTime = Date.now();

    classWrapper.deps.push({
      type: 'sections',
      value: fullSectiondata,
    });
  }


  // This is called for each section that is found on the page.
  parse(body, url, catalogTitle) {
    const $ = cheerio.load(body);

    const elements = $('body > div.pagebodydiv > table > tr > th.ddtitle > a');

    // Object to keep track of this class and the sections found later on.
    const classWrapper = {
      type: 'classes',
      value: {
        crns: [],
        classAttributes: [],
      },
      deps: [],
    };

    const foundNames = [];

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
      possibleClassNameMatches = possibleClassNameMatches.concat(foundNames);

      className = this.standardizeClassName(className, possibleClassNameMatches);

      foundNames.push(className);

      // Setup this new section in the parsedClassMap with the fixed name.
      if (catalogTitle !== className) {
        sectionStartingData.info = className;
      }
      classWrapper.value.crns.push(sectionURLParsed.crn);

      sectionStartingData.crn = sectionURLParsed.crn;

      // Find the next row.
      let classDetails = element.next;
      while (classDetails.type !== 'tag') {
        classDetails = classDetails.next;
      }

      const items = $('.fieldlabeltext', classDetails);

      let classAttributes = [];

      for (let i = 0; i < items.length; i++) {
        if ($(items[i]).text().trim().toLowerCase() === 'classAttributes:') {
          classAttributes = items[i].nextSibling.data.trim().split(', ');

          for (let k = 0; k < classAttributes.length; k++) {
            classAttributes[k] = classAttributes[k].trim();
          }

          // If class attributes doesn't already exist on this class object, assign it
          if (!classWrapper.value.classAttributes) {
            classWrapper.value.classAttributes = classAttributes;
          } else if (!_.isEquals(classAttributes, classWrapper.value.classAttributes)) {
            // If it does, just log a warning and don't re-assign
            macros.log('Warning: class classAttributes are different than a different section on this same class.');
          }


          break;
        }
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
            // The Z's and the +0000 ensure that this date is parsed in +0000 time zone.
            // Without this, it will parse this date (Apr 30, 2015) in local time (Apr 30, 2015 00:00 +0800) and the 0s below will be in local time too (1970 08:00 +0800)
            // So, if you are running this code in Asia, it will say that there is one day of a difference less than there would be if you are running it in North America
            // The Z's and moment(0, 'x')'s below ensure that everything is parsed at UTC+0
            const startDate = moment(`${splitTimeString[0].trim()} +0000`, 'MMM D,YYYY Z');
            const endDate = moment(`${splitTimeString[1].trim()} +0000`, 'MMM D,YYYY Z');

            if (!startDate.isValid() || !endDate.isValid()) {
              macros.log('ERROR: one of parsed dates is not valid', splitTimeString, url);
            }

            // Add the dates if they are valid.
            // Store as days since epoch 1970.
            if (startDate.isValid()) {
              sectionStartingData.meetings[index].startDate = startDate.diff(moment(0, 'x'), 'day');
            }

            if (endDate.isValid()) {
              sectionStartingData.meetings[index].endDate = endDate.diff(moment(0, 'x'), 'day');
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

      sectionStartingDatas.push(sectionStartingData);
    }


    // Sort the CRNs in each class.
    // This makes sure that the CRNs will always be in the same order for the given CRNs.
    // (so tests with .equals will work)
    classWrapper.value.crns.sort();

    return {
      classWrapper: classWrapper,
      sectionStartingDatas: sectionStartingDatas,
    };
  }

  async test() {
    // const output = await this.main('https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=201810&subj_in=ENGW&crse_in=3302&schd_in=LEC');
    const output = await this.main('https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=201810&subj_in=PSYC&crse_in=1101&schd_in=LEC');
    macros.log(JSON.stringify(output, null, 4));
  }
}


EllucianClassParser.prototype.EllucianClassParser = EllucianClassParser;
const instance = new EllucianClassParser();


if (require.main === module) {
  instance.test();
}


export default instance;
