import cheerio from 'cheerio';
import macros from '../../../macros';
import Request from '../../request';
import parseMeetings from './meetingParser';

const request = new Request('bannerv9Parser');

/**
 * @param searchResultsFromXE the resulting data from
 * https://jennydaman.gitlab.io/nubanned/dark.html#studentregistrationssb-search-get
 * @returns an object that conforms to the SearchNEU backend mergedOutput.sections structure
 */
async function allSectionDetails(searchResultsFromXE) {
  const crn = searchResultsFromXE.courseReferenceNumber;
  const termId = searchResultsFromXE.term;
  const allDetails = {};
  (await Promise.all([
    getSeats(termId, crn),
    getOnline(termId, crn),
    getHonors(termId, crn),
    getMeetingTimes(termId, crn)
  ])).forEach(detailsObject => {
    Object.assign(allDetails, detailsObject);
  });
  return {
    // object spread on allDetails gives these keys:
    // seatsCapacity: 30,
    // seatsRemaining: 2,
    // waitCapacity: 99,
    // waitRemaining: 99,
    // online: false,
    // honors: false,
    // meetings: [...],
    ...allDetails,
    url: 'https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched'
      + `?term_in=${searchResultsFromXE.term}&crn_in=${crn}`,
    crn: crn,
    lastUpdateTime: Date.now(),
    termId: searchResultsFromXE.term,
    host: 'neu.edu',
    // WARNING: this object is missing the key subCollegeName
    subject: searchResultsFromXE.subject,
    classId: searchResultsFromXE.courseNumber,
  };
}


/**
 * Makes a POST request to
 * https://nubanner.neu.edu/StudentRegistrationSsb/ssb/searchResults/<endpoint>
 * with the body
 * term=000000&courseReferenceNumber=00000
 *
 * @param endpoint
 * @param termId
 * @param crn
 * @returns {Promise<Request>}
 */
async function searchResults(endpoint, termId, crn) {
  const req = await request.post({
    url: `https://nubanner.neu.edu/StudentRegistrationSsb/ssb/searchResults/${endpoint}`,
    form: {
      term: termId,
      courseReferenceNumber: crn
    },
    cache: false
  });

  if (req.statusCode !== 200)
    macros.error(`${endpoint} for termId=${termId} and CRN=${crn} didn't work`);

  return req;
}


// https://jennydaman.gitlab.io/nubanned/dark.html#searchresults-enrollment-info-post
async function getSeats(termId, crn) {

  const req = await searchResults('getEnrollmentInfo', termId, crn);
  const dom = cheerio.parseHTML(req.body);

  return {
    seatsCapacity: extractSeatsFromDom(dom, 'Enrollment Maximum:'),
    // number of seats that have been filled
    // seatsFilled: extractSeatsFromDom(dom, 'Enrollment Actual:'),
    seatsRemaining: extractSeatsFromDom(dom, 'Enrollment Seats Available:'),
    waitCapacity: extractSeatsFromDom(dom, 'Waitlist Capacity:'),
    // number of people on the waitlist
    // waitTaken: extractSeatsFromDom(dom, 'Waitlist Actual:'),
    waitRemaining: extractSeatsFromDom(dom, 'Waitlist Seats Available:'),
  };
  // maybe I should do some error checking that extractSeatsFromDom actually worked
}


/**
 * Selects the integer value in the sibling of the element that contains the key text
 * @param domArray should be the result of cheerio.parseHTML
 * @param key {string}
 * @returns {number}
 */
function extractSeatsFromDom(domArray, key) {
  key = key.trim();
  for (let i = 0; i < domArray.length; i++) {
    const ele = cheerio(domArray[i]);
    if (ele.text().trim() === key) // or should I use string.prototype.includes()?
      return parseInt(ele.next().text().trim());
  }
  return -999; // did not find the value
}


async function getOnline(termId, crn) {
  return { online: (await getClassDetails(termId, crn)).online };
}

/**
 * https://jennydaman.gitlab.io/nubanned/dark.html#searchresults-class-details-post
 */
async function getClassDetails(termId, crn) {

  const req = await searchResults('getClassDetails', termId, crn);
  const dom = cheerio.parseHTML(req.body);
  const $ = cheerio.load(req.body);

  const credits = parseInt(extractTextFromDom(dom, 'Credit Hours:'));
  return {
    online: extractTextFromDom(dom, 'Campus: ') === 'Online',
    campus: extractTextFromDom(dom, 'Campus: '), // eg. 'Boston'
    scheduleType: extractTextFromDom(dom, 'Schedule Type: '), // eg. 'Lab' or 'Lecture'
    instructionalMethod: extractTextFromDom(dom, 'Instructional Method: '), // eg. 'Traditional' or 'Online'
    sectionNumber: $('#sectionNumber').text(), // eg. '02'
    subject: $('#subject').text(), // eg. 'Physics'
    classId: $('#courseNumber').text(), // eg. '1147'
    name: $('#courseTitle').text(), // eg. 'Physics for Life Sciences 2',
    maxCredits: credits, // eg. 4
    minCredits: credits, // eg. 4
  };
}


/**
 * Selects the text as a String that follows the element that contains the target key
 * @param domArray should be the result of cheerio.parseHTML
 * @param key {string}
 * @returns {string}
 */
function extractTextFromDom(domArray, key) {
  key = key.trim();
  for (let i = 0; i < domArray.length - 2; i++) {
    const ele = cheerio(domArray[i]);
    if (ele.text().trim() === key) {
      const textNode = domArray[i + 1];
      if (textNode.type !== 'text')
        macros.error(`Expected a text node in DOM (result of cheerio.parseHTML) at index ${i + 1}`, domArray);
      if (!textNode.data || typeof textNode.data !== 'string')
        macros.error('cheerio parsed HTML text node data is invalid', textNode);
      return textNode.data.trim();
    }
  }
  return null; // did not find the value
}


async function getHonors(termId, crn) {
  for (const attr of await getSectionAttributes(termId, crn)) {
    if (attr.toLowerCase().includes('honors'))
      return { honors: true };
  }
  return { honors: false };
}

/**
 * example output:
 * [ 'Honors  GNHN', 'NUpath Natural/Designed World  NCND',
 * 'NU Core Science/Tech Lvl 1  NCT1', 'UG College of Science  UBSC' ]
 *
 * https://jennydaman.gitlab.io/nubanned/dark.html#searchresults-section-attributes-post
 */
async function getSectionAttributes(termId, crn) {
  const req = await searchResults('getSectionAttributes', termId, crn);
  const $ = cheerio.load(req.body);
  const list = [];
  $('span').each(function (i, element) {
    list[i] = $(this).text().trim();
  });
  return list;
}


async function getMeetingTimes(termId, crn) {
  const data = await request.get({
    url: 'https://nubanner.neu.edu/StudentRegistrationSsb/ssb/searchResults'
      + `/getFacultyMeetingTimes?term=${termId}&courseReferenceNumber=${crn}`,
    json: true,
  });
  // object so that it can be spread in the calling function above
  return { meetings: parseMeetings(data.body) };
}



import cs2500 from '../../../tests/dataxe/searchResults/cs2500.json';
import chem2311 from '../../../tests/dataxe/searchResults/chem2311.json';

async function main() {
  // BIOL 1141 for Fall 2019
  // BIOL 3605 for Summer 2 2019 is online
  // macros.log(await getSeats(202010, 17983));
  // const BIOL3605 = await getClassDetails(201960, 61066);
  // macros.log(BIOL3605.online); // === true
  // macros.log((await getClassDetails(202010, 17983)).online); // === true
  // macros.log((await getClassDetails(202010, 10243)).online); // === false
  // macros.log(await getSectionAttributes(202010, 17983));
  // macros.log(await getSectionAttributes(202010, 10259)); // this is an honors class
  // macros.log(await getMeetingTimes(202010, 17983));
  // macros.log(JSON.stringify(await allSectionDetails(cs2500.data[0])));
  macros.log(JSON.stringify(await allSectionDetails(chem2311.data[0])));
}

main();


export default allSectionDetails;
export { allSectionDetails, getSectionAttributes, getClassDetails };
