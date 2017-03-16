import request from 'superagent';
import * as acorn from 'acorn';
import cheerio from 'cheerio';
import fs from 'fs-promise';
import mkdirp from 'mkdirp-promise';
import path from 'path';
import macros from './macros';


// Example schema:
//   { audience: 'Undergraduate',
//     organizationemailaddress: '[redacted]@gmail.com',
//     facebookPage: 'https://www.facebook.com/[redacted]/',
//     meetingDay: 'Tuesday',
//     meetingTime: '7:00 PM',
//     meetingLocation: 'Lake Hall',
//     advisorName: 'Peter Simon',
//     presidentName: 'bob smith',
//     treasurerName: 'joe smith',
//     organizationMissionStatement: 'ECO.....',
//     name: 'EconPress',
//     site: 'http://www.northeastern.edu/econpress' },

// Not scraping right now: Description and some other stuff. No reason, just haven't had a reason to add it yet :P


async function scrapeDetails(url) {
  console.log(url);

  // Fire a get to that url
  const detailHtml = (await request.get(url)).text;

  // load the new html
  const $ = cheerio.load(detailHtml);

  // this part needs to be cleaned up but yea
  const detailElements = $('#profile_for_org > ul > li');

  const obj = {};

  // console.log(detailElements.length, url)
  // Looks like need to grab the href from the links but this is close
  for (let i = 0; i < detailElements.length; i++) {
    const $thisEle = $(detailElements[i]);

    // Get the key and convert it to cammel case
    let key = $('strong', $thisEle).text();

    key = key.trim();
    if (key.endsWith(':')) {
      key = key.slice(0, key.length - 1);
    }
    key = key.replace(/ /gi, '');
    key = key[0].toLowerCase() + key.slice(1);

    // Get the value of this field
    // If its a link to something, get all the links
    // If not, get the text
    let value;
    const possibleLinks = $('a', $thisEle);

    if (possibleLinks.length > 0) {
      const emails = [];
      for (let j = 0; j < possibleLinks.length; j++) {
        emails.push(possibleLinks[j].attribs.href);
      }
      value = emails;
    } else {
      value = $('p', $thisEle).text();
    }

    if (value) {
      obj[key] = value;
    }
  }

  // Remove mailto: from the beginning of the email addr
  if (obj.organizationemailaddress && obj.organizationemailaddress.length > 0) {
    for (let j = 0; j < obj.organizationemailaddress.length; j++) {
      const email = obj.organizationemailaddress[j];
      if (email.startsWith('mailto:')) {
        obj.organizationemailaddress[j] = email.slice('mailto:'.length);
      }
    }
  }

  // Slurp up the name
  const name = $('#full_profile > h2').text().trim();
  obj.name = name;

  // and get link jawn too
  const site = $('#org_extranet_url > a');
  if (site.length > 0) {
    obj.site = site[0].attribs.href;
  }

  if (Object.keys(obj).length < 3) {
    console.log('Error', url);
  }

  return obj;
}


async function scrapeLetter(letter) {
  const resp = await request.post(`http://neu.orgsync.com/search/get_orgs_by_letter/${letter.toUpperCase()}`);

  // Abstract Syntax Trees are the data structure that is used to parse programming languages (like javascript)
  // Like, the first step of running a programming language is to parse it into a AST
  // then preform a bunch of optimizations on it
  // and then compile it to machine code (if it is something like C)
  // or just run the AST directly (like python or js)
  // google for more info, feel free to log this directly
  const ast = acorn.parse(resp.text);

  // The reponse that we get back from that url is two lines of JS code
  // We are looking for the string arguments in the second line
  const html = ast.body[1].expression.arguments[0].value;

  // Dope, lets treat that as HTML and parse it
  const $ = cheerio.load(html);

  // Get all the a elements from it
  const elements = $('a');

  const orgs = [];
  const promises = [];

  // Look through all the below elements
  for (let i = elements.length - 1; i >= 0; i--) {
    if (!elements[i].attribs || !elements[i].attribs.href || elements[i].attribs.href === '#' || !elements[i].attribs.href.includes('show_profile')) {
      continue;
    }

    promises.push(scrapeDetails(elements[i].attribs.href).then((org) => {
      orgs.push(org);
    }));
  }


  await Promise.all(promises);

  return orgs;
}


async function main() {
  let orgs = [];

  const promises = [];

  macros.ALPHABET.split('').forEach((letter) => {
    promises.push(scrapeLetter(letter).then((someOrgs) => {
      console.log(letter, 'had', someOrgs.length, 'orgs now at ', orgs.length);
      orgs = orgs.concat(someOrgs);
    }));
  });

  await Promise.all(promises);

  const outputPath = path.join(macros.PUBLIC_DIR, 'getClubs', 'neu.edu');

  await mkdirp(outputPath);

  await fs.writeFile(path.join(outputPath, 'data.json'), JSON.stringify(orgs));
  console.log('done!', orgs.length);
}

if (require.main === module) {
  main();
}


export default main;