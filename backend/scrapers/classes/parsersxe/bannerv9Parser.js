/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */


import cache from '../../cache';
import macros from '../../../macros';
import Request from '../../request';
import EllucianTermsParser from '../parsers/ellucianTermsParser';
import SearchResultsParser from './searchResultsParser';

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
  async main(termsUrl) {

    // Possibly load from DEV
    if (macros.DEV && require.main !== module) {
      const devData = await cache.get(macros.DEV_DATA_DIR, this.constructor.name, termsUrl);
      if (devData) {
        return devData;
      }
    }

    // Request the url
    // If you want to spider a site, you can use LinkSpider.js

    // If you need to deal with cookies, check out scrapers/employees/employee.js
    // which gets a cookie from one page before any other requests will work
    // If you need more advanced cookie management or cookie jar stuff we could build that out somehow
    let bannerTerms = await request.get({
      url: termsUrl,
      json: true,
    });
    bannerTerms = bannerTerms.body;


    // ========================================
    // my code starts here
    // ========================================

    const termsToKeep = bannerTerms.filter((term) => {
      return EllucianTermsParser.isValidTerm(term.code, term.description);
    });
    // termsToKeep = termsToKeep.slice(3, 6); // DEBUG to save time

    const sneuTerms = this.serializeTermsList(termsToKeep);

    let subjectsRequests = [];
    let sectionsDataPerEveryTerm = [];
    termsToKeep.forEach((term) => {
      sectionsDataPerEveryTerm.push(this.requestsSectionsForTerm(term.termId));
      subjectsRequests.push(this.requestSubject(term.termId));
    });
    subjectsRequests = await Promise.all(subjectsRequests);
    sectionsDataPerEveryTerm = await Promise.all(sectionsDataPerEveryTerm);

    let allSubjects = [];
    sneuTerms.forEach((term) => {
      const subjectResponse = subjectsRequests.shift();
      allSubjects = allSubjects.concat(this.processSubjectListResponse(subjectResponse, term));
    });

    const detailsRequests = [];
    sectionsDataPerEveryTerm.forEach((allSectionsFromTerm) => {
      allSectionsFromTerm.forEach((searchResultsFromXE) => {
        // searchResultsFromXE is JSON object from here
        // https://jennydaman.gitlab.io/nubanned/dark.html#studentregistrationssb-search-get
        detailsRequests.push(SearchResultsParser.mostDetails(searchResultsFromXE));
      });
    });
    const allSections = await Promise.all(detailsRequests);

    // TOD: Run any other parsers you want to run
    // All of the other existing parsers run 0 or 1 other parsers, but you can run any number
    // just keep it managable

    // let outputFromOtherParsers = await someOtherParser.main(urlOrSomeData);

    const subjectAbbreviationTable = SearchResultsParser.createSubjectsAbbreviationTable(allSubjects);
    const uniqueClasses = await this.collapseSameCourses(allSections, subjectAbbreviationTable);
    // TODO prune obsolete prerequisites (classes that don't exist)
    // eg BIOL 3405 lists BIOL 1103, BIOL 2297, and ENVR 2290 however these classes are no longer offered
    allSections.forEach(details => SearchResultsParser.stripSectionDetails(details));

    const mergedOutput = {
      colleges: [
        {
          host: 'neu.edu',
          title: 'Northeastern University',
          url: 'neu.edu',
        },
      ],
      terms: sneuTerms,
      subjects: allSubjects,
      classes: uniqueClasses,
      sections: allSections,
    };

    // Possibly save the mergedOutput to disk so we don't have to run all this again
    if (macros.DEV && require.main !== module) {
      await cache.set(macros.DEV_DATA_DIR, this.constructor.name, termsUrl, mergedOutput);
      // Don't log anything because there would just be too much logging.
    }
    return mergedOutput;
  }

  serializeTermsList(termsFromBanner) {
    return termsFromBanner.map((term) => {
      this.renameKey(term, 'code', 'termId');
      this.renameKey(term, 'description', 'text');
      term.host = 'neu.edu';
      const subCollege = this.determineSubCollegeName(term.text);
      if (subCollege === 'undergraduate') {
        term.text = term.text.replace(/ (Semester|Quarter)/, '');
      } else {
        term.subCollegeName = subCollege;
      }
      return term;
    });
  }

  /**
   * Gets information about all the sections from the given term code.
   * @param termCode
   * @return {Promise<Array>}
   */
  async requestsSectionsForTerm(termCode) {
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

    if (clickContinue.body.regAllowed === false) {
      macros.error(`failed to get cookies (from clickContinue) for the term ${termCode}`, clickContinue);
    }

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
      if (chunk.body.success === false) {
        macros.error(`one of the searchResults requests for ${termCode} was unsuccessful`, chunk);
      }
      allSections = allSections.concat(chunk.body.data);
    });
    return allSections;
  }


  requestSubject(termId) {
    const MAX = 200;
    const URL = 'https://nubanner.neu.edu/StudentRegistrationSsb/ssb/classSearch/get_subject';
    const subjectUrl = `${URL}?searchTerm=&term=${termId}&offset=1&max=${MAX}`;
    return request.get({
      url: subjectUrl,
      json: true,
    });
  }

  processSubjectListResponse(subjectResponse, term) {
    if (subjectResponse.statusCode !== 200) {
      macros.error(`Problem with request for subjects ${subjectResponse.request.uri.href}`);
    }
    return subjectResponse.body.map((subjectData) => ({
      subject: subjectData.code,
      text: subjectData.description,
      termId: term.termId,
      host: term.host,
    }));
  }


  /**
   * Loops over the details for all sections, creating a new array of every unique class
   * with a list of offered CRNs corresponding to each separate section.
   * @param sections large array of objects that came from SearchResultsParser.mostDetails(s)
   */
  async collapseSameCourses(sections, subjectAbbreviationTable) {
    const table = {};
    let promisedDescriptions = [];
    const promisedHashes = [];

    // first, get the description once for every unique class
    sections.forEach(details => {
      details.hash = this.hash(details);
      if (!table[details.hash]) {
        table[details.hash] = true;
        promisedHashes.push(details.hash);
        promisedDescriptions.push(SearchResultsParser.copySectionAsClass(details, subjectAbbreviationTable));
      }
    });

    promisedDescriptions = await Promise.all(promisedDescriptions);
    for (let i = 0; i < promisedHashes.length; i++) {
      table[promisedHashes[i]] = promisedDescriptions[i];
    }

    sections.forEach(details => {
      table[details.hash].crns.push(details.crn);
    });

    return Object.values(table);
  }

  /**
   * {termId: "202010", subject: "BIOL", classId: "3405"} => "202010BIOL3405"
   * @param details
   * @return {string}
   */
  hash(details) {
    return details.termId + details.subject + details.classId;
  }

  /**
   * mutates the object directly
   * renameKey({old: 5}, 'old', 'name') -> {name: 5}
   * @param obj
   * @param old
   * @param name
   */
  renameKey(obj, old, name) {
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
  determineSubCollegeName(termDesc) {
    if (termDesc.includes('CPS')) {
      return 'CPS';
    }
    if (termDesc.includes('Law')) {
      return 'LAW';
    }
    return 'undergraduate';
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
