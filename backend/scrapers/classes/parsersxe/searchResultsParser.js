import cheerio from 'cheerio';
import macros from '../../../macros';
import Request from '../../request';
const request = new Request('bannerv9Parser');

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
    seatsCapacity: extractValueFromDom(dom, 'Enrollment Maximum:'),
    // number of seats that have been filled
    // seatsFilled: extractValueFromDom(dom, 'Enrollment Actual:'),
    seatsRemaining: extractValueFromDom(dom, 'Enrollment Seats Available:'),
    waitCapacity: extractValueFromDom(dom, 'Waitlist Capacity:'),
    // number of people on the waitlist
    // waitTaken: extractValueFromDom(dom, 'Waitlist Actual:'),
    waitRemaining: extractValueFromDom(dom, 'Waitlist Seats Available:'),
  };
  // maybe I should do some error checking that extractValueFromDom actually worked
}

/**
 * Selects the integer value in the sibling element of the element that contains the key text
 * @param dom should be the result of cheerio.parseHTML
 * @param key {string}
 * @returns {number}
 */
function extractValueFromDom(dom, key) {
  for (let i = 0; i < dom.length; i++) {
    const ele = cheerio(dom[i]);
    if (ele.text().includes(key))
      return parseInt(ele.next().text().trim());
  }
  return -999; // did not find the value
}

async function main() {
  // BIOL 1141 for Fall 2019
  macros.log(await getSeats(202010, 17983));
}

main();
