/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import cheerio from 'cheerio';

import cache from '../cache';
import macros from '../../macros';
import { Divider } from 'semantic-ui-react';

const request = require('request');

// TODO

// Could parse a lot more from each page
// Phone numbers with extentions are not parsed http://www.civ.neu.edu/people/patterson-mark


// http://www.coe.neu.edu/connect/directory?field_faculty_type_value=faculty&letter=A

// As of 8/29/19, COE has a new website, and this file will need to be re-written.
// This was removed from matchEmployees.js, but when its re-written just add it back.
// https://github.com/ryanhugh/searchneu/issues/95

class COE {
//   scrapeDetailpage(body) {
//     const obj = {};

//     const $ = cheerio.load(body);

//     // Full resolution image.
//     obj.profilePic = $('#faculty-profile > div.upper-content > div > div.left-content > a').attr('href');

//     // Linkedin link.
//     const linkedin = $('div.field-name-field-nucoe-social-link-url > div > div > a.linkedin').attr('href');
//     if (linkedin) {
//       obj.linkedin = linkedin;
//     }

//     const googleScholarLink = $('div.field-name-field-nucoe-social-link-url > div > div > a.googlescholar').attr('href');

//     const userId = macros.parseGoogleScolarLink(googleScholarLink);
//     if (userId) {
//       obj.googleScholarId = userId;
//     }

//     const youtubeLink = $('div.field-name-field-nucoe-social-link-url > div > div > a.youtube').attr('href');
//     if (youtubeLink) {
//       obj.youtubeLink = youtubeLink;
//     }

//     // Example of person who has multiple roles in departments.
//     // http://www.che.neu.edu/people/ebong-eno

//     // Position and department
//     const roles = $('div.field-collection-container > div.faculty-roles > div.faculty-roles__role');
//     const positions = [];
//     for (let i = 0; i < roles.length; i++) {
//       const rolesChildren = roles[i].children;
//       if (rolesChildren.length === 0) {
//         macros.log('Roles has no children', obj);
//         continue;
//       }

//       if (rolesChildren[0].data === undefined) {
//         macros.log("Skipping role because it didn't have role and department", obj);
//         continue;
//       }

//       let role = rolesChildren[0].data.trim();
//       const department = $('a', $(roles[i])).text();

//       if (role.endsWith(',')) {
//         role = role.slice(0, role.length - 1);
//       }

//       positions.push({
//         role: role,
//         department: department,
//       });
//     }

//     if (positions.length > 0) {
//       obj.primaryRole = positions[0].role;
//       obj.primaryDepartment = positions[0].department;

//       // Hold off on keeping the positions for now.
//       // Need to ensure it is the same schema as CCIS (which does not have department for each role).
//       // obj.positions = positions;
//     }

//     // Address
//     let officeSplit = $('div.faculty-profile__address').text().trim();
//     officeSplit = officeSplit.replace(/[\n\r]+\s*/gi, '\n').split('\n');

//     obj.officeRoom = officeSplit[0];
//     obj.officeStreetAddress = officeSplit[1];

//     // Might be more than one of these, need to check .text() for each one
//     // if text matches Faculty Website then get href
//     // also need to do head checks or get checks to make sure their site is up
//     const links = $('div.field-name-field-faculty-links a');
//     const otherLinks = [];
//     for (let i = 0; i < links.length; i++) {
//       const href = $(links[i]).attr('href');
//       const text = $(links[i]).text();

//       const compareText = text.toLowerCase();
//       if (compareText === 'faculty website' || compareText === 'faculty website & cv') {
//         obj.personalSite = href;
//       } else if (href.includes('scholar.google.com')) {
//         // If it is a link to Google Scholar, parse it.
//         // If already parsed a google scholar link for this person, log a warning and ignore this one.
//         const otherGoogleId = macros.parseGoogleScolarLink(href);
//         if (!obj.googleScholarId) {
//           obj.googleScholarId = userId;
//         } else if (obj.googleScholarId !== otherGoogleId) {
//           macros.log('Employee had 2 google id links pointing to different IDs, ignoring the second one.', obj.url, obj.googleScholarId, otherGoogleId);
//         }
//       } else {
//         otherLinks.push({
//           link: href,
//           text: text,
//         });
//       }
//     }

//     if (otherLinks.length > 0) {
//       obj.otherLinks = otherLinks;
//     }

//     return obj;
//   }


//   scrapeLetter(body) {
//     const $ = cheerio.load(body);
//     /**
//      * CHANGE - Link to divs of people
//      */
//     const peopleElements = $('div.canvas > main#main-content > div.main.container--clear > div.people-listing > div.list > #div.grid--4  > div');

//     console.log(peopleElements.length);

//     const people = [];
//     for (let i = 0; i < peopleElements.length; i++) {
//       const personElement = peopleElements[i];

//       const $personElement = $(personElement);

//       const obj = {};

//       // thumbnail image of them
//       /**
//        * CHANGE - img part
//        */
//       obj.picThumbnail = $('div > div > img', $personElement).attr('src');

//       // link to their page
//       /**
//        * CHANGED -  h2 instead of h4
//        */
//       obj.url = $('h2 > a', $personElement).attr('href');
//       if (!obj.url) {
//         macros.log('Error, could not parse url for', obj);
//       }

//       console.log("URL" + obj.url);

//       // name of prof
//       obj.name = $('h2 > a', $personElement).text().trim();

//       // Parse the first name and the last name from the given name
//       const { firstName, lastName } = macros.parseNameWithSpaces(obj.name);

//       if (firstName && lastName) {
//         obj.firstName = firstName;
//         obj.lastName = lastName;
//       }

//       // interests
//       /**
//        * CHANGED
//        */
//       obj.interests = $('div.caption', $personElement).text().trim();

//       // Parse email
//       /**
//        * CHANGED
//        */
//       let email = $('ul > li > a', $personElement).attr('href');
//       email = macros.standardizeEmail(email);

//       if (email) {
//         obj.emails = [email];
//       } else {
//         macros.log('Could not parse email');
//       }


//       // Phone
//       /**
//        * CHANGED
//        */
//       let phone = $('li', $personElement).text();

//       phone = macros.standardizePhone(phone);

//       if (phone) {
//         obj.phone = phone;
//       }


//       ['picThumbnail', 'url', 'name', 'interests', 'emails', 'phone'].forEach((attr) => {
//         if (!obj[attr]) {
//           macros.log('obj missing ', attr, obj.name);
//         }
//       });

//       people.push(obj);
//     }

//     console.log(people);

//     return people;
//   }

  async main() {
    if (macros.DEV && require.main !== module) {
      const devData = await cache.get(macros.DEV_DATA_DIR, this.constructor.name, 'main');
      if (devData) {
        return devData;
      }
    }

    //const promises = [];
    let people = [];

    request({
      method: 'GET',
      url: 'https://coe.northeastern.edu/faculty-staff-directory/?display=all'
    }, (err, res, body) => {

      if (err) return console.error(err);

      let $ = cheerio.load(body);

      console.log($('.grid--4 > div').get().length)
    });

//     macros.ALPHABET.split('').forEach((letter) => {
//       /**
//        * CHANGED - Updated URL to current COE link
//        */
//       const promise = request.get(`https://coe.northeastern.edu/faculty-staff-directory/?alpha=${letter}`);

//       promise.then((resp) => {
//         const peopleFromLetter = this.scrapeLetter(resp.body);
//         people = people.concat(peopleFromLetter);c
//       });

//       promises.push(promise);
//     });

//     await Promise.all(promises);


//     const detailPeopleList = await Promise.all(people.map(async (person) => {
//       const resp = await request.get(person.url);

//       // Get more details for this person and save it with the same object.
//       const moreDetails = this.scrapeDetailpage(resp.body);
//       const retVal = {};
//       Object.assign(retVal, person, moreDetails);
//       return retVal;
//     }));

    //macros.log(detailPeopleList.length);

    if (macros.DEV) {
      await cache.set(macros.DEV_DATA_DIR, this.constructor.name, 'main', people);
      macros.log(people.length, 'coe people saved!');
    }

    return people;
  }
}


const instance = new COE();
export default instance;

if (require.main === module) {
  instance.main();
}

