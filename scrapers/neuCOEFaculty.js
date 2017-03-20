// import request from 'superagent';
import cheerio from 'cheerio';
import fs from 'fs-promise';
import mkdirp from 'mkdirp-promise';
import path from 'path';
import URI from 'urijs';

import request from './request'
import utils from './utils';
import macros from './macros';


// TODO

// Could parse a lot more from each page
// Phone numbers with extentions are not parsed http://www.civ.neu.edu/people/patterson-mark


// http://www.coe.neu.edu/connect/directory?field_faculty_type_value=faculty&letter=A


async function scrapeDetailpage(obj) {
  const resp = await request.get('http://www.ece.neu.edu/people/erdogmus-deniz');

  const $ = cheerio.load(resp.body);
  debugger;

  // full resolution image
  $('#faculty-profile > div.upper-content > div > div.left-content > a').attr('href');


  // linkedin link
  $('div.field-name-field-nucoe-social-link-url > div > div > a.linkedin').attr('href');

  $('div.field-name-field-nucoe-social-link-url > div > div > a.googlescholar').attr('href');


  $('div.field-name-field-nucoe-social-link-url > div > div > a.youtube').attr('href');

  // example of person who has multiple roles in departments
  // http://www.che.neu.edu/people/ebong-eno
  // Position and department
  $('div.field-collection-container > div.faculty-roles > div.faculty-roles__role', $(items[0]));

  // position (includes trailing comma)
  $('div.field-collection-container > div.faculty-roles > div.faculty-roles__role', $(items[0]))[0].children[0].data;


  // department
  $('div.field-collection-container > div.faculty-roles > div.faculty-roles__role > a', $(items[0])).text();

// address
  $('div.faculty-profile__address').text().trim().replace(/[\n\r]+\s*/gi, '\n');

    // might be more than one of these, need to check .text() for each one
    // if text matches Faculty Website then get href
    // also need to do head checks or get checks to make sure their site is up
  $($('div.field-name-field-faculty-links a')[0]).text();


  debugger;
}


async function scrapeLetter(letter) {
  const resp = await request.get(`http://www.coe.neu.edu/connect/directory?field_faculty_type_value=faculty&letter=${letter.toUpperCase()}`)

  const $ = cheerio.load(resp.body);

  const peopleElements = $('div.item-list > ul > li.views-row');

  const people = [];
  for (let i = 0; i < peopleElements.length; i++) {
    const personElement = peopleElements[i];

    const $personElement = $(personElement);

    var obj = {};

    // thumbnail image of them
    obj.picThumbnail = $('h4 > a > img', $personElement).attr('src');

    // link to their page
    obj.link = $('h4 > a', $personElement).attr('href');

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

    people.push(obj)
  }

  return people;
}


async function main() {

  const outputFile = path.join(macros.DEV_DATA_DIR, 'coe.json')


  const promises = [];
  let people = [];



  macros.ALPHABET.split('').forEach((letter) => {
    promises.push(scrapeLetter(letter).then((peopleFromLetter) => {
      people = people.concat(peopleFromLetter);
    }));
  });

  await Promise.all(promises);

  console.log(people.length);


  if (macros.DEV) {
    await fs.writeFile(outputFile, JSON.stringify(people));
    console.log('saved file')
  }
  return people
}


exports.go = main;

if (require.main === module) {
  main();
}
