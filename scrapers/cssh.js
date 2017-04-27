import cheerio from 'cheerio';
import path from 'path';


import macros from './macros';
import utils from './utils';
import linkSpider from './linkSpider';
import request from './request';


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
    obj.name = $('#lightbox-container > div.col-lg-3.col-md-3.col-sm-6.fac-single > h1').text().trim();

    // Parse the first name and the last name from the given name
    let {firstName, lastName} = utils.parseNameWithSpaces(obj.name)

    if (firstName && lastName) {
      obj.firstName = firstName;
      obj.lastName = lastName;
    }

    // Scrape the picture of the prof
    obj.image = $('#lightbox-container > div.col-lg-3.col-md-3.col-sm-6.fac-single > img.headshot').attr('src').trim();

    // Job Title
    // "Assistant Professor Sociology and Health Science"
    const primaryRole = $('#lightbox-container > div.col-lg-3.col-md-3.col-sm-6.fac-single > div.fac-single-title').text().trim().split(';')[0];
    obj.primaryRole = primaryRole.replace(/\s+/gi, ' ')

    // Parse out the email. 
    let emailElements = $('#lightbox-container > div.col-lg-3.col-md-3.col-sm-6.fac-single > p > a');

    let emailElement = null;
    for (var i = 0; i < emailElements.length; i++) {
      const element = emailElements[i];
      if (element.attribs.href.startsWith('mailto')) {
        if (emailElement) {
          console.log('Error, already saw a email element')
        }
        else {
          emailElement = element
        }
      }
    }

    emailElement = $(emailElement)

    // Parse both the email it is linked to and the email that is displayed to ensure they are the same.
    const mailto = utils.standardizeEmail(emailElement.attr('href')).trim();
    const email = utils.standardizeEmail(emailElement.text().trim()).trim();

    // If they are different, log a warning and skip this email.
    if ((mailto || email) && mailto !== email) {
      console.log('Warning; mailto !== email, skipping', mailto, email, 'done yo');
    } else if (mailto === email && email) {

      // If they are the same and they are not an empty string or undefined, keep the email.
      obj.emails = [email];
    }


    // Phone number and office location are just both in a <p> element separated by <br>.
    // Dump all the text and then figure out where the phone and office is.
    const descriptionElements = $('#lightbox-container > div.col-lg-3.col-md-3.col-sm-6.fac-single')[0].children;

    let category = null;
    const office = [];

    descriptionElements.forEach((element) => {

      if (element.type === 'text') {

        // Discard all text elements until the start of the first category
        if (category === null) {
          return;
        }

        // Discard empty text elements
        if (element.data.trim().length === 0) {
          return;
        }

        // Add lines that are a part of the Address category to the office field.
        if (category === 'Mailing Address') {
          const newText = element.data.trim();
          if (newText) {
            office.push(newText);
          }
        }

        // The phone number is under the contact field
        else if (category === 'Contact:') {
          console.log(element.data.trim(), 'phone??');
        }
      } 

      // Behaviors for hitting tags
      else if (element.type === 'tag') {

        // If hit a valid h4 element, change the category to the text in the h4 element
        if (element.name === 'h4') {

          // If an h4 element but not a category, log an error
          if (element.children.length !== 1 || element.children[0].type !== 'text') {
            console.log('error finding category text', element.children);
            return;
          }

          // Ensure that its children is valid too. 
          const h4Text = element.children[0].data.trim();
          if (h4Text.length < 0) {
            console.log('Found h4 with no text?', element.children);
            return;
          }

          category = h4Text;
        }

        // Ignore a couple other types of elements
        else if (element.name === 'br') {
          return;
        }
      } else if (element.type !== 'script') {
        console.error('Unknown type of element.', element.type);
      }
    });


    obj.officeRoom = office[0];
    obj.officeStreetAddress = office[1];

    return obj;
  }


  async main() {

    const outputFile = path.join(macros.DEV_DATA_DIR, 'cssh.json');

    if (macros.DEV && require.main !== module) {
      const devData = await utils.loadDevData(outputFile);
      if (devData) {
        return devData;
      }
    }

    const startingLinks = ['https://www.northeastern.edu/cssh/faculty'];

    const urls = await linkSpider.main(startingLinks);

    let profileUrls = [];

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
      await utils.saveDevData(outputFile, people);
      console.log('cssh file saved!');
    }

    return people;
  }

}


const instance = new Cssh();

if (require.main === module) {
 instance.main();
}

export default instance;
