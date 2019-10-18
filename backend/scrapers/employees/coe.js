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
      if (err)
        return console.error(err);

      let $ = cheerio.load(body);
      //This call should return 558 (number of employees in COE)
      //console.log($('.grid--4 > div').get().length);
      
      /**
       * CURRENT SITUATION - Returns each name correctly, but info is all over the place
       *  - How to deal with div.caption not being the same (sometimes just title, sometimes also interests)
       *  - Correctly manage some people don't have an associated phone #
       */

      let personNum = 0;

      people = $('.grid--4 > div').get().map((person) => {
        const obj = {};
        let name = $('div > div > h2 > a').get(personNum).children[0].data;
        if (name) {
          obj.name = name;
        }
        else {
          macros.log('Could not parse name');
        }
        let title = $('div > div > div.caption').get(0).children[0].data.trim();
        if (title) {
          obj.title = title;
        }
        else {
          macros.log('Could not parse title');
        }
        let email = macros.standardizeEmail($('ul.caption > li > a').get(personNum).children[0].data);
        if (email) {
          obj.email = email;
        }
        else {
          macros.log('Could not parse email');
        }
        let phone = macros.standardizePhone($('ul.caption > li').get(personNum).children[0].data);
        if (phone) {
          obj.phone = phone;
        }
        else {
          macros.log('Could not parse phone');
        }
        console.log(obj);
        personNum++;
      });
    })

    console.log(people.length);



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

