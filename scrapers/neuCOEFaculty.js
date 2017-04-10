import cheerio from 'cheerio';
import path from 'path';

import request from './request';
import utils from './utils';
import macros from './macros';


// TODO

// Could parse a lot more from each page
// Phone numbers with extentions are not parsed http://www.civ.neu.edu/people/patterson-mark


// http://www.coe.neu.edu/connect/directory?field_faculty_type_value=faculty&letter=A


async function scrapeDetailpage(obj) {
  const resp = await request.get(obj.link);
  // const resp = await request.get('http://www.ece.neu.edu/people/erdogmus-deniz');

  const $ = cheerio.load(resp.body);

  // full resolution image
  obj.profilePic = $('#faculty-profile > div.upper-content > div > div.left-content > a').attr('href');

  // linkedin link
  obj.linkedin = $('div.field-name-field-nucoe-social-link-url > div > div > a.linkedin').attr('href');

  const googleScholarLink = $('div.field-name-field-nucoe-social-link-url > div > div > a.googlescholar').attr('href');

  const userId = utils.parseGoogleScolarLink(googleScholarLink);
  if (userId) {
    obj.googleScholarId = userId;
  }


  obj.youtubeLink = $('div.field-name-field-nucoe-social-link-url > div > div > a.youtube').attr('href');

  // example of person who has multiple roles in departments
  // http://www.che.neu.edu/people/ebong-eno
  // Position and department
  const roles = $('div.field-collection-container > div.faculty-roles > div.faculty-roles__role');
  const positions = [];
  for (let i = 0; i < roles.length; i++) {
    let role = roles[i].children[0].data.trim();
    const department = $('a', $(roles[i])).text();

    if (role.endsWith(',')) {
      role = role.slice(0, role.length - 1);
    }

    positions.push({
      role: role,
      department: department,
    });
  }

  if (positions.length > 0) {
    obj.positions = positions;
  }

  // address
  obj.office = $('div.faculty-profile__address').text().trim().replace(/[\n\r]+\s*/gi, '\n');

  // might be more than one of these, need to check .text() for each one
  // if text matches Faculty Website then get href
  // also need to do head checks or get checks to make sure their site is up
  const links = $('div.field-name-field-faculty-links a');
  const otherLinks = [];
  for (let i = 0; i < links.length; i++) {
    const href = $(links[i]).attr('href');
    const text = $(links[i]).text();

    const compareText = text.toLowerCase();
    if (compareText === 'faculty website' || compareText === 'faculty website & cv') {
      obj.personalSite = href;
    } else if (href.includes('scholar.google.com')) {
      // If it is a link to Google Scholar, parse it.
      // If already parsed a google scholar link for this person, log a warning and ignore this one.
      const otherGoogleId = utils.parseGoogleScolarLink(href);
      if (!obj.googleScholarId) {
        obj.googleScholarId = userId;
      } else if (obj.googleScholarId !== otherGoogleId) {
        console.log('Employee had 2 google id links pointing to different IDs, ignoring the second one.', obj.link, obj.googleScholarId, otherGoogleId);
      }
    } else {
      otherLinks.push({
        link: href,
        text: text,
      });
    }
  }

  if (otherLinks.length > 0) {
    obj.otherLinks = otherLinks;
  }

  return obj;
}


async function scrapeLetter(letter) {
  const resp = await request.get(`http://www.coe.neu.edu/connect/directory?field_faculty_type_value=faculty&letter=${letter.toUpperCase()}`);

  const $ = cheerio.load(resp.body);

  const peopleElements = $('div.item-list > ul > li.views-row');

  const people = [];
  for (let i = 0; i < peopleElements.length; i++) {
    const personElement = peopleElements[i];

    const $personElement = $(personElement);

    const obj = {};

    // thumbnail image of them
    obj.picThumbnail = $('h4 > a > img', $personElement).attr('src');

    // link to their page
    obj.link = $('h4 > a', $personElement).attr('href');
    if (!obj.link) {
      console.log('Error, could not parse link for', obj);
    }

    // name of prof
    obj.name = $('div.views-field.views-field-field-faculty-last-name > h4 > a', $personElement).text().trim();

    // interests
    obj.interests = $('div.field-name-field-faculty-interests', $personElement).text().trim();

    // Parse email
    let email = $('div.views-field-field-faculty-email > div.field-content > a', $personElement).attr('href');

    email = utils.standardizeEmail(email);

    if (!email) {
      console.log('Could not parse email');
    }

    obj.email = email;

    // Phone
    let phone = $('div.views-field-field-faculty-phone > div.field-content', $personElement).text();

    phone = utils.standardizePhone(phone);

    if (phone) {
      obj.phone = phone;
    }


    ['picThumbnail', 'link', 'name', 'interests', 'email', 'phone'].forEach((attr) => {
      if (!obj[attr]) {
        console.log('obj missing ', attr, obj.name);
      }
    });

    people.push(obj);
  }

  return people;
}


async function main() {
  const outputFile = path.join(macros.DEV_DATA_DIR, 'coe.json');

  if (macros.DEV && require.main !== module) {
    const devData = await utils.loadDevData(outputFile)
    if (devData) {
      return devData;
    }
  }

  const promises = [];
  let people = [];


  macros.ALPHABET.split('').forEach((letter) => {
    promises.push(scrapeLetter(letter).then((peopleFromLetter) => {
      people = people.concat(peopleFromLetter);
    }));
  });

  await Promise.all(promises);

  console.log(people.length);


  const detailPeopleList = await Promise.all(people.map((person) => {
    return scrapeDetailpage(person);
  }));

  console.log(detailPeopleList.length);

  if (macros.DEV) {
    await utils.saveDevData(outputFile, people);
    console.log('coe file saved!');
  }

  return people;
}


exports.go = main;

if (require.main === module) {
  main();
}
