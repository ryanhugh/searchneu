import request from 'superagent';
import cheerio from 'cheerio';
import fs from 'fs-promise';
import mkdirp from 'mkdirp-promise';
import path from 'path';
import macros from './macros';
import URI from 'urijs';


async function scrapePeopleList() {
  const resp = await request('http://www.ccis.northeastern.edu/people-view-all/');

  const $ = cheerio.load(resp.text);

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
      const email = emailElements.text().trim();
      let mailto = emailElements.attr('href').trim();


      if (mailto.startsWith('mailto:')) {
        mailto = mailto.slice('mailto:'.length);
      }

      if (mailto !== email) {
        console.log('Error bad emails?', email, mailto);
      }

      obj.email = email;
    }


    // Phone
    const phoneElements = $('div.contact-info > div.phone > a', $personElement);
    if (phoneElements.length > 0) {
      let phone = phoneElements.text().trim();

      let tel = phoneElements.attr('href').trim();

      if (tel.startsWith('tel:')) {
        tel = tel.slice('tel:');
      }

      phone = phone.replace(/[^0-9]/gi, '');
      tel = tel.replace(/[^0-9]/gi, '');

      if (tel.length !== 0 || phone.length !== 0) {
        if (tel !== phone) {
          console.log('phone tel mismatch', tel, phone, obj);
        }

        if (phone.length !== 10) {
          console.log('?????', phone, tel);
        } else if (phone) {
          obj.phone = phone;
        }
      }
    }


    ['name', 'link', 'positions', 'email'].forEach((attrName) => {
      if (!obj[attrName]) {
        console.log('Missing', attrName, 'for', obj.name);
      }
    });

    output.push(obj);
  }
  return output;
}

async function scrapeDetailpage(obj) {
  const resp = await request(obj.link).retry(10);


  const $ = cheerio.load(resp.text);

  const office = $('div.contact-block > div.address > p').text();
  if (office) {
    obj.office = office.trim();
  }

  obj.personalSite = $('div.contact-block > div.contact-links > p.personal-site > a').attr('href');
  if (obj.personalSite) {
    obj.personalSite = obj.personalSite.trim();
  }

  const googleScholarLink = $('div.contact-block > div.contact-links > p.google-scholar > a').attr('href');
  if (googleScholarLink) {
    const userId = new URI(googleScholarLink).query(true).user;
    if (!userId && googleScholarLink) {
      console.log('Error parsing google url', googleScholarLink);
    } else {
      obj.googleScholarId = userId;
    }
  }

  obj.bigPictureLink = $('header.people-header > div.section-inner > img').attr('src');
  if (obj.bigPictureLink) {
    obj.bigPictureLink = obj.bigPictureLink.trim();
  }

  return obj;
}


async function main() {
  const peopleObjects = await scrapePeopleList();

  const promises = [];
  const output = [];

  // Cool, parsed all of the info from the first page
  // Now scrape each profile
  peopleObjects.slice(0, 100).forEach((obj) => {
    promises.push(scrapeDetailpage(obj).then((detailPage) => {
      output.push(detailPage);
    }));
  });

  await Promise.all(promises);

  console.log(output);
}

if (require.main === module) {
  main();
}


// http://www.ccis.northeastern.edu/people-view-all/
