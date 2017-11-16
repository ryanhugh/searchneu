/*
 * This file is part of Search NEU and licensed under AGPL3. 
 * See the license file in the root folder for details. 
 */

import cheerio from 'cheerio';
import path from 'path';

import macros from '../../macros';
import linkSpider from '../linkSpider';
import Request from '../request';
import cache from '../cache';

const request = new Request('Camd');

class Camd {

  // Given a list of elements, this will return the text from all the elements that are text elements
  // Each text will be in its own index in the array.
  getShallowText(elements) {
    const retVal = [];
    elements.forEach((element) => {
      if (element.type !== 'text') {
        return;
      }

      const text = element.data.trim();
      if (text.length > 0) {
        retVal.push(text);
      }
    });
    return retVal;
  }


  parseDetailpage(url, body) {
    const obj = {};

    // The url of the person's profile page
    obj.url = url;

    const $ = cheerio.load(body);

    // Name of person
    obj.name = $('#main > div.pagecenter > div > div > div > div > div.col10.last.right > h1.entry-title').text().trim().split(',')[0];

    // Parse the first name and the last name from the given name
    const { firstName, lastName } = macros.parseNameWithSpaces(obj.name);

    if (firstName && lastName) {
      obj.firstName = firstName;
      obj.lastName = lastName;
    }

    obj.image = $('#main > div.pagecenter > div > div > div > div > div.col5 > img.wp-post-image').attr('src');
    if (obj.image) {
      obj.image = obj.image.trim();
    }

    // Primary Role
    // "Associate Professor – Design, Interactive Media"
    let primaryRole = $('#main > div.pagecenter > div > div > div > div > div.col10 > p.introp').text().trim().split(';')[0];
    if (primaryRole.length > 35) {
      // Two different types of dash character
      primaryRole = primaryRole.split(' - ')[0].split(' – ')[0];
    }
    obj.primaryRole = primaryRole;

    // Phone number and office location are just both in a <p> element separated by <br>.
    // Dump all the text and then figure out where the phone and office is.
    const descriptionElements = $('#main div.pagecenter div.gdcenter div.col16 > div.col5 > p.smallp')[0].children;

    let email = $('#main > div.pagecenter > div > div > div > div:nth-child(1) > div.col5 > p > a').text().trim();
    email = macros.standardizeEmail(email);
    if (email) {
      obj.emails = [email];
    }

    const texts = this.getShallowText(descriptionElements);

    texts.forEach((text) => {
      text = text.trim();
      const possiblePhone = macros.standardizePhone(text);
      if (possiblePhone) {
        if (obj.phone) {
          console.log('Duplicate phone?', obj.phone, possiblePhone);
        }

        obj.phone = possiblePhone;
      }

      // If the email was not hyperlinked, it would not be picked up by the prior email parsing and instead would appear here.
      else if (text.match(/[\w\d-.]+@[\w\d-.]+/) && !obj.emails) {
        console.warn('Parsing plain text as email:', text);
        obj.emails = [text];
      }

      // If phone did not match, check office.
      else if (text.length > 3) {
        if (text.startsWith('Office: ')) {
          text = text.slice('Office: '.length);
        }

        if (obj.officeRoom) {
          console.log('Two matches for office, keeping the longer one', obj.office, text);

          // Only update the office if the new office is longer.
          // This rarely happens, but the longer the string is the more likely it is to be an office location.
          // In all of CAMD, there are only 2 instance where this helps
          if (obj.officeRoom.length < text.length) {
            obj.officeRoom = text;
          }

          return;
        }

        obj.officeRoom = text;
      } else {
        console.log('Warn: unknown prop in description', text);
      }
    });

    return obj;
  }


  async main() {
    const outputFile = path.join(macros.DEV_DATA_DIR, 'camd.json');

    if (macros.DEV && require.main !== module) {
      const devData = await cache.get('dev_data', this.constructor.name, 'main');
      if (devData) {
        return devData;
      }
    }


    const startingLinks = [
      'https://camd.northeastern.edu/architecture/faculty-staff',
      'https://camd.northeastern.edu/artdesign/faculty-staff',
      'https://camd.northeastern.edu/commstudies/faculty-staff',
      'https://camd.northeastern.edu/gamedesign/faculty-staff',
      'https://camd.northeastern.edu/journalism/faculty-staff',
      'https://camd.northeastern.edu/mscr/faculty-staff',
      'https://camd.northeastern.edu/music/faculty-staff',
      'https://camd.northeastern.edu/theatre/faculty-staff',
    ];


    const urls = await linkSpider.main(startingLinks);

    const profileUrls = [];

    // Filter all the urls found to just profile urls
    // 'https://camd.northeastern.edu/artdesign/people/magy-seif-el-nasr-2/',
    urls.forEach((url) => {
      if (url.match(/https:\/\/camd.northeastern.edu\/(architecture|artdesign|commstudies|gamedesign|journalism|mscr|music|theatre)\/people\/[\w\d-]+\/?/i)) {
        profileUrls.push(url);
      }
    });


    const promises = [];

    profileUrls.forEach((url) => {
      promises.push(request.get(url).then((response) => {
        return this.parseDetailpage(url, response.body);
      }));
    });

    const people = await Promise.all(promises);


    if (macros.DEV) {
      await cache.set('dev_data', this.constructor.name, 'main', people);
      console.log(people.length, 'camd people saved to the cache file!');
    }

    return people;
  }

}


const instance = new Camd();

if (require.main === module) {
  instance.main();
}

export default instance;
