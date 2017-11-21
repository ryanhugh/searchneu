/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import cheerio from 'cheerio';

import macros from '../../macros';
import linkSpider from '../linkSpider';
import cache from '../cache';
import Request from '../request';

const request = new Request('CSSH');

// Wrote all of this, then found out that CSSH has a hidden, undocumented API

// All of the faculty are returned by hitting these 4 links that return json:
// https://www.northeastern.edu/cssh/wp-json/wp/v2/faculty?per_page=100&page=1
// https://www.northeastern.edu/cssh/wp-json/wp/v2/faculty?per_page=100&page=2
// https://www.northeastern.edu/cssh/wp-json/wp/v2/faculty?per_page=100&page=3
// https://www.northeastern.edu/cssh/wp-json/wp/v2/faculty?per_page=100&page=4

// One of the APIs returns details on what can be returned (looks like it is mostly faculty and blog posts)
// https://www.northeastern.edu/cssh/wp-json/wp/v2

// Also looks like CSSH uses wordpress blog posts to keep track of their employees (so each employee's profile is a different blog post lol)

class Cssh {
  parseDetailpage(url, resp) {
    const obj = {};

    obj.url = url;

    const $ = cheerio.load(resp.body);

    // Scrape the name from a h1
    const name = $('#lightbox-container > div.col-lg-3.col-md-3.col-sm-6.fac-single > h1').text();
    if (name) {
      obj.name = name.trim();
    } else {
      obj.name = '';
      macros.error('Could not scrape prof name.', url);
    }

    // Parse the first name and the last name from the given name
    const { firstName, lastName } = macros.parseNameWithSpaces(obj.name);

    if (firstName && lastName) {
      obj.firstName = firstName;
      obj.lastName = lastName;
    }

    // Scrape the picture of the prof
    const image = $('#lightbox-container > div.col-lg-3.col-md-3.col-sm-6.fac-single > img.headshot').attr('src');
    if (image) {
      obj.image = image.trim();
    } else {
      macros.log('Could not scrape image.', url);
    }

    // Job Title
    // "Assistant Professor Sociology and Health Science"
    let primaryRole = $('#lightbox-container > div.col-lg-3.col-md-3.col-sm-6.fac-single > div.fac-single-title').text();
    if (primaryRole) {
      primaryRole = primaryRole.trim().split(';')[0];
      obj.primaryRole = primaryRole.replace(/\s+/gi, ' ');
    } else {
      macros.log('Could not scrape job title', url);
    }

    // Parse out the email.
    const emailElements = $('#lightbox-container > div.col-lg-3.col-md-3.col-sm-6.fac-single > p > a');

    let emailElement = null;
    for (let i = 0; i < emailElements.length; i++) {
      const element = emailElements[i];
      if (element.attribs.href.startsWith('mailto')) {
        if (emailElement) {
          macros.log('Error, already saw a email element');
        } else {
          emailElement = element;
        }
      }
    }

    emailElement = $(emailElement);

    // Parse both the email it is linked to and the email that is displayed to ensure they are the same.
    const mailto = macros.standardizeEmail(emailElement.attr('href'));
    const email = macros.standardizeEmail(emailElement.text().trim());

    // If they are different, log a warning and skip this email.
    if ((mailto || email) && mailto !== email) {
      macros.log('Warning; mailto !== email, skipping', mailto, email, 'done yo');
    } else if (mailto === email && email) {
      // If they are the same and they are not an empty string or undefined, keep the email.
      obj.emails = [email];
    }


    // Phone number and office location are just both in a <p> element separated by <br>.
    // Dump all the text and then figure out where the phone and office is.
    const descriptionElements = $('#lightbox-container > div.col-lg-3.col-md-3.col-sm-6.fac-single')[0].children;

    let category = null;
    const office = [];

    for (const element of descriptionElements) {
      if (element.type === 'text') {
        // Discard all text elements until the start of the first category
        if (category === null) {
          continue;
        }

        // Discard empty text elements
        if (element.data.trim().length === 0) {
          continue;
        }

        // Add lines that are a part of the Address category to the office field.
        if (category === 'Mailing Address') {
          const newText = element.data.trim();
          if (newText) {
            office.push(newText);
          }
        } else if (category === 'Contact:') {
          // The phone number is under the contact field
          macros.log(element.data.trim(), 'phone??');
        }
      } else if (element.type === 'tag') { // Behaviors for hitting tags
        // If hit a valid h4 element, change the category to the text in the h4 element
        if (element.name === 'h4') {
          // If an h4 element but not a category, log an error
          if (element.children.length !== 1 || element.children[0].type !== 'text') {
            macros.log('error finding category text', element.children);
            continue;
          }

          // Ensure that its children is valid too.
          const h4Text = element.children[0].data.trim();
          if (h4Text.length < 0) {
            macros.log('Found h4 with no text?', element.children);
            continue;
          }

          category = h4Text;
        }

        // Ignore all other types of elements.
        // <br>s should definitely be ignored, and there has been no reason to process other tags yet.
        continue;
      } else if (element.type !== 'script') {
        macros.error('Unknown type of element.', element.type);
      }
    }

    if (office.length > 0) {
      obj.officeRoom = office[0];

      // Need to remove trailing commas
      if (obj.officeRoom.endsWith(',')) {
        obj.officeRoom = obj.officeRoom.slice(0, obj.officeRoom.length - 1);
      }

      obj.officeStreetAddress = office[1];
    }

    return obj;
  }


  async main() {
    if (macros.DEV && require.main !== module) {
      const devData = await cache.get('dev_data', this.constructor.name, 'main');
      if (devData) {
        return devData;
      }
    }

    const startingLinks = ['https://www.northeastern.edu/cssh/faculty'];

    const urls = await linkSpider.main(startingLinks);

    const profileUrls = [];

    // Filter all the urls found to just profile urls
    // 'https://www.northeastern.edu/cssh/faculty/noemi-daniel-voionmaa',
    urls.forEach((url) => {
      if (url.match(/https:\/\/www.northeastern.edu\/cssh\/faculty\/[\d\w-]+\/?/i)) {
        profileUrls.push(url);
      }
    });

    const promises = [];

    profileUrls.forEach((url) => {
      promises.push(request.get(url).then((response) => {
        return this.parseDetailpage(url, response);
      }));
    });

    const people = await Promise.all(promises);

    if (macros.DEV) {
      await cache.set('dev_data', this.constructor.name, 'main', people);
      macros.log(people.length, 'cssh people saved to a file!');
    }

    return people;
  }
}


const instance = new Cssh();

if (require.main === module) {
  instance.main();
}

export default instance;
