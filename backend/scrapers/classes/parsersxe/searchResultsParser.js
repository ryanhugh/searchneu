import cheerio from 'cheerio';
import macros from '../../../macros';
import Request from '../../request';
const request = new Request('bannerv9Parser');

// TODO
// write one primary function that makes all these requests to get all the details for one section given termId, crn
// returns all the details combined in one object

// https://jennydaman.gitlab.io/nubanned/dark.html#searchresults-enrollment-info-post
async function getSeats(termId, crn) {

  const req = await request.post({
    url: 'https://nubanner.neu.edu/StudentRegistrationSsb/ssb/searchResults/getEnrollmentInfo',
    form: {
      term: termId,
      courseReferenceNumber: crn
    },
    cache: false
  });

  if (req.statusCode !== 200)
    macros.error(`getEnrollmentInfo for termId=${termId} and CRN=${crn} didn't work`);

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

// https://jennydaman.gitlab.io/nubanned/dark.html#searchresults-class-details-post
async function getClassDetails(termId, crn) {

  const req = await request.post({
    url: 'https://nubanner.neu.edu/StudentRegistrationSsb/ssb/searchResults/getClassDetails',
    form: {
      term: termId,
      courseReferenceNumber: crn
    },
    cache: false
  });

  if (req.statusCode !== 200)
    macros.error(`getClassDetails for termId=${termId} and CRN=${crn} didn't work`);

  const dom = cheerio.parseHTML(req.body);
  const $ = cheerio.load(req.body);

  const credits = parseInt(extractTextFromDom(dom, 'Credit Hours:'));
  return {
    online: extractTextFromDom(dom, 'Campus: ') === 'Online',
    // campus: extractTextFromDom(dom, 'Campus: '), // eg. 'Boston'
    // scheduleType: extractTextFromDom(dom, 'Schedule Type: '), // eg. 'Lab' or 'Lecture'
    // instructionalMethod: extractTextFromDom(dom, 'Instructional Method: '), // eg. 'Traditional' or 'Online'
    // sectionNumber: $('#sectionNumber').text(), // eg. '02'
    // subject: $('#subject').text(), // eg. 'Physics'
    // classId: $('#courseNumber').text(), // eg. '1147'
    // name: $('#courseTitle').text(), // eg. 'Physics for Life Sciences 2',
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

// TODO
// returns a list of attributes
// parse list determine honors and NUPath
// https://jennydaman.gitlab.io/nubanned/dark.html#searchresults-section-attributes-post
async function getSectionAttributes(termId, crn) {

}

async function main() {
  // BIOL 1141 for Fall 2019
  //macros.log(await getSeats(202010, 17983));
  // BIOL 3605 for Summer 2 2019 is online
  const BIOL3605 = await getClassDetails(201960, 61066);
  // macros.log(BIOL3605.online); // === true
  // macros.log((await getClassDetails(202010, 17983)).online); // === true
  // macros.log((await getClassDetails(202010, 10243)).online); // === false
}

main();
