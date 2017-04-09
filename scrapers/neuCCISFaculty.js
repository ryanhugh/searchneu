import cheerio from 'cheerio';
import fs from 'fs-promise';
import mkdirp from 'mkdirp-promise';
import path from 'path';
<<<<<<< HEAD
import URI from 'urijs';

import request from './request';
import utils from './utils'
import macros from './macros';



// http://www.ccis.northeastern.edu/people-view-all/
// Scraped info: 
=======

import request from './request';
import utils from './utils';
import macros from './macros';


// http://www.ccis.northeastern.edu/people-view-all/
// Scraped info:
>>>>>>> master
  // "name": "Amal Ahmed",
  // "link": "http://www.ccis.northeastern.edu/people/amal-ahmed/",
  // "positions": ["Assistant Professor"],
  // "email": "amal@ccs.neu.edu",
  // "phone": "6173732076",
  // "office": "440 Huntington Avenue\r\n328 West Village H\r\nBoston, MA 02115",

  // This varies a lot. Some have links to their page on other schools, some have self hosted sites, etc
  // "personalSite": "http://www.ccs.neu.edu/home/amal/",

<<<<<<< HEAD
  // Link to some google site. Get url with: 
=======
  // Link to some google site. Get url with:
>>>>>>> master
  // 'https://scholar.google.com/citations?user=' + googleScholarId + '&hl=en&oi=ao'
  // "googleScholarId": "Y1C007wAAAAJ",
  // "bigPictureLink": "http://www.ccis.northeastern.edu/wp-content/uploads/2016/03/Amal-Ahmed-hero-image.jpg"


<<<<<<< HEAD
// There were a few people that put non-google urls on the google url field. 
// These links are ignored at the moment. 
// They could be used in place of the personal website link, but there were only a few professors and most of them had personal website links too. 

class neuCCISFaculty {

  parsePeopleList(resp) {

=======
// There were a few people that put non-google urls on the google url field.
// These links are ignored at the moment.
// They could be used in place of the personal website link, but there were only a few professors and most of them had personal website links too.

class NeuCCISFaculty {

  parsePeopleList(resp) {
>>>>>>> master
    const $ = cheerio.load(resp.body);

    const output = [];

    const peopleElements = $('div.letter > div.people > article.people-directory');


    for (let i = 0; i < peopleElements.length; i++) {
      const $personElement = $(peopleElements[i]);
      const obj = {};

      obj.name = $('h3.person-name', $personElement).text().trim();

      // Link to profile
      obj.link = $('h3.person-name > a', $personElement).attr('href').trim();

      // positions at neu (eg PhD Student)
      const positions = $('div.position-list > span.position', $personElement);
      if (positions.length > 0) {
        obj.positions = [];
        for (let j = 0; j < positions.length; j++) {
          obj.positions.push($(positions[j]).text().trim());
        }
      }

      // email
      const emailElements = $('div.contact-info > div.email > a', $personElement);

      // also email
      if (emailElements.length > 0) {
        const email = utils.standardizeEmail(emailElements.text().trim());
<<<<<<< HEAD
        let mailto = utils.standardizeEmail(emailElements.attr('href').trim());


        if (!mailto || !email || mailto !== email) {
          utils.log("Warning: bad emails?", email, mailto, obj.name)
        }
        else {
=======
        const mailto = utils.standardizeEmail(emailElements.attr('href').trim());


        if (!mailto || !email || mailto !== email) {
          utils.log('Warning: bad emails?', email, mailto, obj.name);
        } else {
>>>>>>> master
          obj.email = email;
        }
      }


      // Phone
      const phoneElements = $('div.contact-info > div.phone > a', $personElement);
      if (phoneElements.length > 0) {
        let phone = phoneElements.text().trim();

        let tel = phoneElements.attr('href').trim();

<<<<<<< HEAD
        tel = utils.standardizePhone(tel)
        phone = utils.standardizePhone(phone)
=======
        tel = utils.standardizePhone(tel);
        phone = utils.standardizePhone(phone);
>>>>>>> master

        if (tel || phone) {
          if (!tel || !phone || tel !== phone) {
            utils.log('phone tel mismatch', tel, phone, obj);
<<<<<<< HEAD
          }
          else {
=======
          } else {
>>>>>>> master
            obj.phone = phone;
          }
        }
      }


      ['name', 'link', 'positions', 'email'].forEach((attrName) => {
        if (!obj[attrName]) {
          utils.log('Missing', attrName, 'for', obj.name);
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
      obj.office = office.replace(/\r\n/gi, '\n').trim();
    }

    obj.personalSite = $('div.contact-block > div.contact-links > p.personal-site > a').attr('href');
    if (obj.personalSite) {
      obj.personalSite = obj.personalSite.trim();
    }

    const googleScholarLink = $('div.contact-block > div.contact-links > p.google-scholar > a').attr('href');

    const userId = utils.parseGoogleScolarLink(googleScholarLink);
    if (userId) {
      obj.googleScholarId = userId;
    }

    obj.bigPictureLink = $('header.people-header > div.section-inner > img').attr('src');
    if (obj.bigPictureLink) {
      obj.bigPictureLink = obj.bigPictureLink.trim();
    }

    return obj;
  }


  async main() {
<<<<<<< HEAD

    const outputFile = path.join(macros.DEV_DATA_DIR, 'ccis.json')

    // if this is dev and this data is already scraped, just return the data
    if (macros.DEV && require.main !== module) {
      var exists = await fs.exists(outputFile)
      if (exists) {
        return JSON.parse(await fs.readFile(outputFile))
      }
    }


    const resp = await request.get('http://www.ccis.northeastern.edu/people-view-all/');
    const peopleObjects = this.parsePeopleList(resp);


=======
    const outputFile = path.join(macros.DEV_DATA_DIR, 'ccis.json');

    // if this is dev and this data is already scraped, just return the data
    if (macros.DEV && require.main !== module) {
      const devData = await utils.loadDevData(outputFile)
      if (devData) {
        return devData;
      }
    }

    const resp = await request.get('http://www.ccis.northeastern.edu/people-view-all/');
    const peopleObjects = this.parsePeopleList(resp);

>>>>>>> master
    const promises = [];
    const output = [];

    // Cool, parsed all of the info from the first page
    // Now scrape each profile
<<<<<<< HEAD
    peopleObjects.forEach(async (obj) => {
      promises.push(request.get(obj.link).then((personResponse) => {
        output.push(this.parseDetailpage(personResponse, obj))
      }))
=======
    peopleObjects.forEach((obj) => {
      promises.push(request.get(obj.link).then((personResponse) => {
        output.push(this.parseDetailpage(personResponse, obj));
      }));
>>>>>>> master
    });

    await Promise.all(promises);

    if (macros.DEV) {
<<<<<<< HEAD
      await fs.writeFile(outputFile, JSON.stringify(output));
      utils.log('saved file')
    }

    utils.log('done!');
    return output
  }
}

const instance = new neuCCISFaculty()

module.exports = instance;
=======
      await utils.saveDevData(outputFile, people);
      console.log('coe file saved!');
    }

    utils.log('done!');
    return output;
  }
}

const instance = new NeuCCISFaculty();
export default instance;
>>>>>>> master

if (require.main === module) {
  instance.main();
}

<<<<<<< HEAD

=======
>>>>>>> master
