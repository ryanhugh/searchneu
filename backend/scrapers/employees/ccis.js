/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import cheerio from 'cheerio';

import Request from '../request';
import macros from '../../macros';
import cache from '../cache';

const request = new Request('CCIS');

// http://www.ccis.northeastern.edu/people-view-all/
// Scraped info:
// "name": "Amal Ahmed",
// "url": "http://www.ccis.northeastern.edu/people/amal-ahmed/",
// "positions": ["Assistant Professor"],
// "email": "amal@ccs.neu.edu",
// "phone": "6173732076",
// "office": "440 Huntington Avenue\r\n328 West Village H\r\nBoston, MA 02115",

// This varies a lot. Some have links to their page on other schools, some have self hosted sites, etc
// "personalSite": "http://www.ccs.neu.edu/home/amal/",

// Link to some google site. Get url with:
// 'https://scholar.google.com/citations?user=' + googleScholarId + '&hl=en&oi=ao'
// "googleScholarId": "Y1C007wAAAAJ",
// "bigPictureUrl": "http://www.ccis.northeastern.edu/wp-content/uploads/2016/03/Amal-Ahmed-hero-image.jpg"


// There were a few people that put non-google urls on the google url field.
// These links are ignored at the moment.
// They could be used in place of the personal website url, but there were only a few professors and most of them had personal website links too.

// TODO: also could clean up the first name and last name parsing.
// For 3 people in all of CCIS, they have names like [Panagiotos (Pete) Manolios]
// Currently the first word is used as the first name and the last one is used as the last name
// But we could use the middle one as the first name if it starts and ends with parens


class NeuCCISFaculty {
  parsePeopleList(resp) {
    const $ = cheerio.load(resp.body);

    const output = [];

    const peopleElements = $('div.letter > div.people > article.people-directory');


    for (let i = 0; i < peopleElements.length; i++) {
      const $personElement = $(peopleElements[i]);
      const obj = {};

      obj.name = $('h3.person-name', $personElement).text().trim();

      // Parse the first name and the last name from the given name
      const { firstName, lastName } = macros.parseNameWithSpaces(obj.name);

      if (firstName && lastName) {
        obj.firstName = firstName;
        obj.lastName = lastName;
      }

      // Link to profile.
      obj.url = $('h3.person-name > a', $personElement).attr('href').trim();

      // positions at neu (eg PhD Student)
      const positionElements = $('div.position-list > span.position', $personElement);
      if (positionElements.length > 0) {
        const positions = [];
        for (let j = 0; j < positionElements.length; j++) {
          positions.push($(positionElements[j]).text().trim());
        }

        // Hold off on keeping the positions array for now. Need to ensure it is the same schema as COE (and other parser that are scraping positions).
        obj.primaryRole = positions[0];
      }

      // email
      const emailElements = $('div.contact-info > div.email > a', $personElement);

      // also email
      if (emailElements.length > 0) {
        const email = macros.standardizeEmail(emailElements.text().trim());
        const mailto = macros.standardizeEmail(emailElements.attr('href').trim());


        if (!mailto || !email || mailto !== email) {
          macros.log('Warning: bad emails?', email, mailto, obj.name);
        } else {
          obj.emails = [email];
        }
      }


      // Phone
      const phoneElements = $('div.contact-info > div.phone > a', $personElement);
      if (phoneElements.length > 0) {
        let phone = phoneElements.text().trim();

        let tel = phoneElements.attr('href').trim();

        tel = macros.standardizePhone(tel);
        phone = macros.standardizePhone(phone);

        if (tel || phone) {
          if (!tel || !phone || tel !== phone) {
            macros.log('phone tel mismatch', tel, phone, obj);
          } else {
            obj.phone = phone;
          }
        }
      }


      ['name', 'url', 'emails'].forEach((attrName) => {
        if (!obj[attrName]) {
          macros.log('Missing', attrName, 'for', obj.name);
        }
      });

      output.push(obj);
    }
    return output;
  }


  parseDetailpage(resp, obj = {}) {
    const $ = cheerio.load(resp.body);

    const office = $('div.contact-block > div.address > p').text();
    if (office) {
      const officeSplit = office.replace(/\r\n/gi, '\n').trim().split('\n');

      let officeRoom = officeSplit[1];

      if (officeRoom) {
        officeRoom = officeRoom.trim();

        // Need to remove trailing commas
        if (officeRoom.endsWith(',')) {
          officeRoom = officeRoom.slice(0, officeRoom.length - 1);
        }
        obj.officeRoom = officeRoom;
      }

      obj.officeStreetAddress = officeSplit[0].trim();
    }

    obj.personalSite = $('div.contact-block > div.contact-links > p.personal-site > a').attr('href');
    if (obj.personalSite) {
      obj.personalSite = obj.personalSite.trim();
    }

    const googleScholarUrl = $('div.contact-block > div.contact-links > p.google-scholar > a').attr('href');

    const userId = macros.parseGoogleScolarLink(googleScholarUrl);
    if (userId) {
      obj.googleScholarId = userId;
    }

    obj.bigPictureUrl = $('header.people-header > div.section-inner > img').attr('src');
    if (obj.bigPictureUrl) {
      obj.bigPictureUrl = obj.bigPictureUrl.trim();
    }

    return obj;
  }


  async main() {
    // If this is dev and this data is already scraped, just return the data.
    if (macros.DEV && require.main !== module) {
      const devData = await cache.get('dev_data', this.constructor.name, 'main');
      if (devData) {
        return devData;
      }
    }

    const resp = await request.get('http://www.ccis.northeastern.edu/people-view-all/');
    const peopleObjects = this.parsePeopleList(resp);

    const promises = [];
    const output = [];

    // Cool, parsed all of the info from the first page
    // Now scrape each profile
    peopleObjects.forEach((obj) => {
      promises.push(request.get(obj.url).then((personResponse) => {
        output.push(this.parseDetailpage(personResponse, obj));
      }));
    });

    await Promise.all(promises);

    if (macros.DEV) {
      await cache.set('dev_data', this.constructor.name, 'main', output);
      macros.log(output.length, 'people in ccis saved to a file!');
    }

    macros.log('done!');
    return output;
  }
}

const instance = new NeuCCISFaculty();
export default instance;

if (require.main === module) {
  instance.main();
}

