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

    const toKeep = resp.filter((term) => {
      return EllucianTermsParser.isValidTerm(term.code, term.description);
    });

    let subjects = [];

    toKeep.forEach((term) => {
      const max = 200;
      const subjectUrl = `https://nubanner.neu.edu/StudentRegistrationSsb/ssb/classSearch/get_subject?searchTerm=&term=${term.code}&offset=1&max=${max}`;
      const promise = request.get({
        url: subjectUrl,
        json: true,
      });
      subjects.push(promise);
    });

    subjects = await Promise.all(subjects);

    toKeep.forEach(term => {
      term = term.body;
      // this.getSectionsFromTerm(term.code); TODO
    });

    // await this.getSectionsFromTerm('202010'); TODO

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
      terms: [
        {
          termId: '201960',
          text: 'Summer 2 2019',
          host: 'neu.edu',
        },
      ],
      subjects: [
        {
          subject: 'TCC',
          text: 'Technical Communic - CPS',
          termId: '201925',
          host: 'neu.edu/cps',
        },
      ],
      classes: [
        {
          crns: [],
          classAttributes: [
            'No Course Evaluation',
            'CPS-Professional Programs GR 2',
          ],
          desc: 'Focuses on in-depth project in which a student conducts research or produces a product related to the student’s major field. May be repeated without limit. 1.000 TO 4.000 Lecture hours',
          classId: '7995',
          prettyUrl: 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201925&subj_code_in=TCC&crse_numb_in=7995',
          name: 'Project',
          url: 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=201925&subj_in=TCC&crse_in=7995&schd_in=%',
          lastUpdateTime: 1554252001221,
          maxCredits: 4,
          minCredits: 1,
          termId: '201925',
          host: 'neu.edu/cps',
          subject: 'TCC',
        },
        {
          crns: [
            '30392',
            '30393',
            '34764',
          ],
          classAttributes: [
            'NUpath Natural/Designed World',
            'UG College of Science',
          ],
          prereqs: {
            type: 'or',
            values: [
              {
                classId: '1145',
                subject: 'PHYS',
              },
              {
                classId: '1149',
                subject: 'PHYS',
              },
              {
                classId: '1151',
                subject: 'PHYS',
              },
              {
                classId: '1161',
                subject: 'PHYS',
              },
              {
                classId: '1171',
                subject: 'PHYS',
              },
            ],
          },
          coreqs: {
            type: 'and',
            values: [
              {
                classId: '1148',
                subject: 'PHYS',
              },
            ],
          },
          maxCredits: 4,
          minCredits: 4,
          desc: 'Continues PHYS 1145. Covers heat, electricity, vibrations and waves, sound, geometrical optics, and nuclear physics and radioactivity. The application of physics to a variety of problems in the life and health sciences is emphasized. Electricity topics include electrostatics, capacitance, resistivity, direct-current circuits, and RC circuits. Vibrations and waves topics include simple harmonic motion and wave motion. Sound topics include wave characteristics, the ear, Doppler effect, shock waves, and ultrasound. Optics topics include reflection, mirrors, refraction, total internal reflection, fiber optics, lenses, the eye, telescopes, and microscopes. Nuclear physics and radioactivity topics include atomic nucleus, radioactivity, half-life, radioactive dating, detectors, nuclear reaction, fission, fusion, radiation damage, radiation therapy, PET, and MRI. A laboratory is included. 4.000 Lecture hours',
          classId: '1147',
          prettyUrl: 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201930&subj_code_in=PHYS&crse_numb_in=1147',
          name: 'Physics for Life Sciences 2',
          url: 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=201930&subj_in=PHYS&crse_in=1147&schd_in=%',
          lastUpdateTime: 1554252009829,
          termId: '201930',
          host: 'neu.edu',
          subject: 'PHYS',
        },
      ],
      sections: [
        {
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
          lastUpdateTime: 1554252009569,
          termId: '201930',
          host: 'neu.edu',
          subject: 'PHTH',
          classId: '2350',
        },
      ],
    };


    // Possibly save the mergedOutput to disk so we don't have to run all this again
    if (macros.DEV && require.main !== module) {
      await cache.set(macros.DEV_DATA_DIR, this.constructor.name, url, mergedOutput);

      // Don't log anything because there would just be too much logging.
    }

    return mergedOutput;
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
    clickContinue.headers['set-cookie'].forEach((cookie) => { return cookiejar.setCookie(cookie, 'https://nubanner.neu.edu/StudentRegistrationSsb/'); });

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


Bannerv9Parser.prototype.Bannerv9Parser = Bannerv9Parser;
const instance = new Bannerv9Parser();


if (require.main === module) {
  instance.test();
}

export default instance;
