/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import moment from 'moment';
import cheerio from 'cheerio';

import cache from '../../cache';
import macros from '../../../macros';
import Request from '../../request';
import EllucianTermsParser from '../parsers/ellucianTermsParser';

const request = new Request('bannerv9Parser');

class Bannerv9Parser {
  // parse(body, url) {
  //   macros.log(moment, cheerio, body, url);
  //
  //   // TODO: write
  //   // body is the response from https://nubanner.neu.edu/StudentRegistrationSsb/ssb/registration
  //   // This method should be synchronous, which makes it much easier to test and develop
  //   // the body paremeter is the body of the response of the page
  //   // if you need other response information too (like Set-Cookie headers we can get that stuff too)
  //   // this method doesn't have to use the url parameter
  //   // The only places I tend to use it is for logging - if something breakes I log the url so I can see what url broke stuff
  //   // but if it works the url paremeter isn't used.
  //   // use cheerio to parse out the data you want (
  //   // including urls (or any data, really) that you want to pass to other parsers
  //   // In some of the existing processors I send the url and some parameters for a post request to make to that url
  //   // at the end of this method just return everything you want to keep from parsing the body
  //   // and just return everything
  //   // Check out the other parsers for examples
  //   return {};
  // }

  // This method that
  async main(url) {
    // Possibly load from DEV
    if (macros.DEV && require.main !== module) {
      const devData = await cache.get(macros.DEV_DATA_DIR, this.constructor.name, url);
      if (devData) {
        return devData;
      }
    }

    // Request the url
    // If you want to spider a site, you can use LinkSpider.js

    // If you need to deal with cookies, check out scrapers/employees/employee.js
    // which gets a cookie from one page before any other requests will work
    // If you need more advanced cookie management or cookie jar stuff we could build that out somehow
    let resp = await request.get({
      url: url,
      json: true,
    });
    resp = resp.body;


    // ========================================
    // my code starts here
    // ========================================


    const toKeep = resp.filter((term) => {
      return EllucianTermsParser.isValidTerm(term.code, term.description);
    });

    let subjectsRequests = [];
    let allSectionsData = [];

    toKeep.forEach((term) => {
      const max = 200;
      const subjectUrl = `https://nubanner.neu.edu/StudentRegistrationSsb/ssb/classSearch/get_subject?searchTerm=&term=${term.code}&offset=1&max=${max}`;
      const subjectRequest = request.get({
        url: subjectUrl,
        json: true,
      });
      subjectsRequests.push(subjectRequest);
      allSectionsData.push(this.getSectionsFromTerm(term.code));
    });

    subjectsRequests = await Promise.all(subjectsRequests);
    allSectionsData = await Promise.all(allSectionsData);

    const terms = toKeep.map(term => {
      renameKey(term, 'code', 'termId');
      renameKey(term, 'description', 'text');
      term.host = 'neu.edu';
      const subCollege = determineSubCollegeName(term.text);
      if (subCollege === 'undergraduate')
        term.text = term.text.replace(/ (Semester|Quarter)/, '');
      else
        term.subCollegeName = subCollege;
      return term;
    });

    /*
     * TODO
     * go through every section, add into one array, add unique classes to uniqueClasses
     * concurrent requests to searchResults API for section details such as
     * enrollment, waitlist, meetings
     */
    const allSubjects = [];
    const allSections = [];
    const uniqueClasses = [];

    terms.forEach(term => {
      const subjectResponse = subjectsRequests.shift();
      if (subjectResponse.statusCode !== 200)
        macros.error('Problem with request for subjects' + subjectResponse.request.uri.href);
      subjectResponse.body.forEach(subjectData => {
        allSubjects.push({
          subject: subjectData.code,
          text: subjectData.description,
          termId: term.termId,
          host: term.host,
        });
      });
    });

    allSectionsData.forEach(allSectionsFromTerm => {
      allSectionsFromTerm.forEach(sectionData => {
        allSections.push({
          seatsCapacity: 25,
          seatsRemaining: 3,
          waitCapacity: 99,
          waitRemaining: 99,
          online: false,
          honors: false,
          url: 'https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201930&crn_in=30020',
          crn: '30020',
          meetings: [
            {
              startDate: 17903,
              endDate: 18003,
              profs: [
                'Deborah Milbauer',
              ],
              where: 'Ryder Hall 247',
              type: 'Class',
              times: {
                2: [
                  {
                    start: 42300,
                    end: 48300,
                  },
                ],
              },
            },
            {
              startDate: 17903,
              endDate: 18003,
              profs: [
                'Deborah Milbauer',
              ],
              where: 'Ryder Hall 247',
              type: 'Class',
              times: {
                4: [
                  {
                    start: 53400,
                    end: 59400,
                  },
                ],
              },
            },
            {
              startDate: 18005,
              endDate: 18005,
              profs: [
                'Deborah Milbauer',
              ],
              where: 'TBA',
              type: 'Final Exam',
              times: {
                5: [
                  {
                    start: 37800,
                    end: 45000,
                  },
                ],
              },
            },
          ],
          lastUpdateTime: Date.now(),
          termId: sectionData.term,
          host: 'neu.edu',
          // WARNING: this object is missing the key subCollegeName
          subject: sectionData.subject,
          classId: sectionData.courseNumber,
        });
      });
    });


    // TOD: Run any other parsers you want to run
    // All of the other existing parsers run 0 or 1 other parsers, but you can run any number
    // just keep it managable

    // let outputFromOtherParsers = await someOtherParser.main(urlOrSomeData);

    // TODO: merge the data from outputFromOtherParsers with the output from this parser.
    // every class from every term
    const mergedOutput = {
      colleges: [
        {
          host: 'neu.edu',
          title: 'Northeastern University',
          url: 'neu.edu',
        },
      ],
      terms: terms,
      subjects: allSubjects,
      classes: uniqueClasses,
      sections: allSections,
    };
    // macros.log(mergedOutput);

    // Possibly save the mergedOutput to disk so we don't have to run all this again
    if (macros.DEV && require.main !== module) {
      await cache.set(macros.DEV_DATA_DIR, this.constructor.name, url, mergedOutput);
      // Don't log anything because there would just be too much logging.
    }

    return 'end of bannerv9Parser';
  }

  /**
   * Gets information about all the sections from the given term code.
   * @param termCode
   * @returns {Promise<Array>}
   */
  async getSectionsFromTerm(termCode) {
    // first, get the cookies
    // https://jennydaman.gitlab.io/nubanned/dark.html#studentregistrationssb-clickcontinue-post
    const clickContinue = await request.post({
      url: 'https://nubanner.neu.edu/StudentRegistrationSsb/ssb/term/search?mode=search',
      form: {
        term: termCode,
        studyPath: '',
        studyPathText: '',
        startDatepicker: '',
        endDatepicker: '',
      },
      cache: false,
    });

    if (clickContinue.body.regAllowed === false) macros.error(`failed to get cookies (from clickContinue) for the term ${termCode}`, clickContinue);

    const cookiejar = request.jar();
    clickContinue.headers['set-cookie'].forEach((cookie) => {
      return cookiejar.setCookie(cookie, 'https://nubanner.neu.edu/StudentRegistrationSsb/');
    });

    // second, get the total number of sections in this semester
    let totalCount = await request.get({
      url: 'https://nubanner.neu.edu/StudentRegistrationSsb/ssb/searchResults/searchResults',
      qs: {
        txt_subject: '',
        txt_courseNumber: '',
        txt_term: termCode,
        startDatepicker: '',
        endDatepicker: '',
        pageOffset: '0',
        pageMaxSize: '10',
        sortColumn: 'subjectDescription',
        sortDirection: 'asc',
      },
      jar: cookiejar,
      json: true,
    });

    if (totalCount.body.success === false) macros.error(`could not get sections from ${termCode}`, totalCount);

    totalCount = totalCount.body.totalCount;
    const COURSES_PER_REQUEST = 500;

    // third, create a thread pool to make requests that fetch class data, 500 sections per request.
    // (500 is the limit)
    let sectionsPool = [];
    for (let nextCourseIndex = 0; nextCourseIndex < totalCount; nextCourseIndex += COURSES_PER_REQUEST) {
      sectionsPool.push(request.get({
        url: 'https://nubanner.neu.edu/StudentRegistrationSsb/ssb/searchResults/searchResults',
        qs: {
          txt_subject: '',
          txt_courseNumber: '',
          txt_term: termCode,
          startDatepicker: '',
          endDatepicker: '',
          pageOffset: nextCourseIndex,
          pageMaxSize: COURSES_PER_REQUEST,
          sortColumn: 'subjectDescription',
          sortDirection: 'asc',
        },
        jar: cookiejar,
        json: true,
      }));
    }

    // finally, merge all the section data into one array
    sectionsPool = await Promise.all(sectionsPool);
    let allSections = [];
    sectionsPool.forEach((chunk) => {
      if (chunk.body.success === false) macros.error(`one of the searchResults requests for ${termCode} was unsuccessful`, chunk);
      allSections = allSections.concat(chunk.body.data);
    });
    return allSections;
  }

  // Just a convient test method, if you want to
  async test() {
    const output = await this.main('https://nubanner.neu.edu/StudentRegistrationSsb/ssb/classSearch/getTerms?offset=1&max=200&searchTerm=');
    macros.log(output);
  }
}

// mutates the object directly
// renameKey({old: 5}, 'old', 'name') -> {name: 5}
function renameKey(obj, old, name) {
  obj[name] = obj[old];
  delete obj[old];
}

/**
 * "Spring 2019 Semester" -> "undergraduate"
 * "Spring 2019 Law Quarter" -> "LAW"
 * "Spring 2019 CPS Quarter" -> "CPS"
 *
 * @param termDesc
 * @returns {string}
 */
function determineSubCollegeName(termDesc) {
  if (termDesc.includes('CPS'))
    return 'CPS';
  else if (termDesc.includes('Law'))
    return 'LAW';
  else
    return 'undergraduate';
}

Bannerv9Parser.prototype.Bannerv9Parser = Bannerv9Parser;
const instance = new Bannerv9Parser();


if (require.main === module) {
  instance.test();
}

export default instance;
