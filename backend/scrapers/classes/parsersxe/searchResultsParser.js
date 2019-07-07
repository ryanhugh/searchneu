import cheerio from 'cheerio';
import macros from '../../../macros';
import Request from '../../request';

const request = new Request('bannerv9Parser');

// TODO
// write one primary function that makes all these requests to get all the details for one section given termId, crn
// returns all the details combined in one object

/**
 * @param searchResultsFromXE the resulting data from
 * https://jennydaman.gitlab.io/nubanned/dark.html#studentregistrationssb-search-get
 * @returns something
 */
async function allSectionDetails(searchResultsFromXE) {
  const crn = searchResultsFromXE.courseReferenceNumber;
  const termId = searchResultsFromXE.term;
  const allDetails = {};
  (await Promise.all([
    getSeats(termId, crn),
    getClassDetails(termId, crn),
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
    ...allDetails,
    url: 'https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched'
      + `?term_in=${searchResultsFromXE.term}&crn_in=${crn}`,
    crn: crn,
    meetings: 'TODO', // TODO
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

// https://jennydaman.gitlab.io/nubanned/dark.html#searchresults-class-details-post
async function getClassDetails(termId, crn) {

  const req = await searchResults('getClassDetails', termId, crn);
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

// returns a list of attributes
// parse list determine honors and NUPath
// https://jennydaman.gitlab.io/nubanned/dark.html#searchresults-section-attributes-post
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
  let data = await request.get({
    url: 'https://nubanner.neu.edu/StudentRegistrationSsb/ssb/searchResults'
      + `/getFacultyMeetingTimes?term=${termId}&courseReferenceNumber=${crn}`,
    json: true,
  });
  data = data.body;
  return data;
}


function parseMeetings(meetingsFaculty) {
  return meetingsFaculty.map(meeting => {
    return {
      startDate: 18003, // todo
      endDate: 18003,
      profs: [
        'Deborah Milbauer',
      ],
      where: 'Ryder Hall 247',
      type: 'Class',
      times: {
        2: [
          {
            start: hhmmToMinutes(meeting.beginTime),
            end: hhmmToMinutes(meeting.endTime),
          },
        ],
      },
    }
  });
}

// example "0915" -> 9 * 60 + 15 = 555
function hhmmToMinutes(hhmm) {
  if (hhmm.length !== 4)
    macros.error(`Length of hhmm time string ${hhmm} is not 4`);
  const hours = parseInt(hhmm.substring(0, 2));
  const minutes = parseInt(hhmm.substring(2));
  return hours * 60 + minutes;
}

function mmddyyyyToDaysSinceEpoch(mmddyyyy) {
// TODO use moment.js
}


async function main() {
  // BIOL 1141 for Fall 2019
  // BIOL 3605 for Summer 2 2019 is online
  // macros.log(await getSeats(202010, 17983));
  // const BIOL3605 = await getClassDetails(201960, 61066);
  // macros.log(BIOL3605.online); // === true
  // macros.log((await getClassDetails(202010, 17983)).online); // === true
  // macros.log((await getClassDetails(202010, 10243)).online); // === false
  // macros.log(await getSectionAttributes(202010, 17983));
  // macros.log(await getMeetingTimes(202010, 17983));
  macros.log(await allSectionDetails({
    "id": 207227,
      "term": "201930",
      "termDesc": "Spring 2019 Semester",
      "courseReferenceNumber": "30340",
      "partOfTerm": "1",
      "courseNumber": "2500",
      "subject": "CS",
      "subjectDescription": "Computer Science",
      "sequenceNumber": "01",
      "campusDescription": "Boston",
      "scheduleTypeDescription": "Lecture",
      "courseTitle": "Fundamentals of Computer Science 1",
      "creditHours": null,
      "maximumEnrollment": 75,
      "enrollment": 71,
      "seatsAvailable": 4,
      "waitCapacity": 0,
      "waitCount": 0,
      "waitAvailable": 0,
      "crossList": null,
      "crossListCapacity": null,
      "crossListCount": null,
      "crossListAvailable": null,
      "creditHourHigh": null,
      "creditHourLow": 4,
      "creditHourIndicator": null,
      "openSection": true,
      "linkIdentifier": null,
      "isSectionLinked": false,
      "subjectCourse": "CS2500",
      "faculty": [
      {
        "bannerId": "000550992",
        "category": null,
        "class": "net.hedtech.banner.student.faculty.FacultyResultDecorator",
        "courseReferenceNumber": "30340",
        "displayName": "Mislove, Alan",
        "emailAddress": null,
        "primaryIndicator": true,
        "term": "201930"
      }
    ],
      "meetingsFaculty": [
      {
        "category": "01",
        "class": "net.hedtech.banner.student.schedule.SectionSessionDecorator",
        "courseReferenceNumber": "30340",
        "faculty": [],
        "meetingTime": {
          "beginTime": "0915",
          "building": "EV",
          "buildingDescription": "East Village",
          "campus": "BOS",
          "campusDescription": "Boston",
          "category": "01",
          "class": "net.hedtech.banner.general.overall.MeetingTimeDecorator",
          "courseReferenceNumber": "30340",
          "creditHourSession": 4,
          "endDate": "04/17/2019",
          "endTime": "1020",
          "friday": false,
          "hoursWeek": 3.25,
          "meetingScheduleType": "LEC",
          "meetingType": "CLAS",
          "meetingTypeDescription": "Class",
          "monday": true,
          "room": "024",
          "saturday": false,
          "startDate": "01/07/2019",
          "sunday": false,
          "term": "201930",
          "thursday": true,
          "tuesday": false,
          "wednesday": true
        },
        "term": "201930"
      }
    ],
      "reservedSeatSummary": null,
      "sectionAttributes": [
      {
        "class": "net.hedtech.banner.student.schedule.SectionDegreeProgramAttributeDecorator",
        "code": "NCFQ",
        "courseReferenceNumber": "30340",
        "description": " NUpath Formal/Quant Reasoning",
        "isZTCAttribute": false,
        "termCode": "201930"
      },
      {
        "class": "net.hedtech.banner.student.schedule.SectionDegreeProgramAttributeDecorator",
        "code": "NCND",
        "courseReferenceNumber": "30340",
        "description": " NUpath Natural/Designed World",
        "isZTCAttribute": false,
        "termCode": "201930"
      },
      {
        "class": "net.hedtech.banner.student.schedule.SectionDegreeProgramAttributeDecorator",
        "code": "NCT1",
        "courseReferenceNumber": "30340",
        "description": " NU Core Science/Tech Lvl 1",
        "isZTCAttribute": false,
        "termCode": "201930"
      },
      {
        "class": "net.hedtech.banner.student.schedule.SectionDegreeProgramAttributeDecorator",
        "code": "UBCS",
        "courseReferenceNumber": "30340",
        "description": "Computer&amp;Info Sci",
        "isZTCAttribute": false,
        "termCode": "201930"
      }
    ]
  }));
}

main();


export default allSectionDetails;
