/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import * as acorn from 'acorn';
import cheerio from 'cheerio';
import fs from 'fs-extra';
import mkdirp from 'mkdirp-promise';
import path from 'path';

import macros from '../macros';
import request from './request';


// TODO
// might be able to scrape events off facebook pages for more info on when they are meeting
// also hit the orgsync profile to get more information about meetings
// clean up the parsed data right now. Only parse links out of values for whitelisted values.
// CLean up twitter handles, and make sure that all of the fields are standardized.
// looks like a lot of them havae outdated/missing/incorrect/unparssable timestamps of when they are meeting on here ewwww
// but there is probably enough to get a proof of concept working
// could email to verify
//

// http://neu.orgsync.com/student_orgs
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

class NeuClubs {
  parseDetails(detailHtml) {
    // load the new html
    const $ = cheerio.load(detailHtml);

    // this part needs to be cleaned up but yea
    const detailElements = $('#profile_for_org > ul > li');

    const obj = {};

    // macros.log(detailElements.length, url)
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
    obj.name = $('#full_profile > h2').text().trim();

    // and get link jawn too
    obj.site = $('#org_extranet_url > a').attr('href');

    // Scrape the organization portal link too.
    obj.orgPortalLink = $('#org-portal-link > strong > a').attr('href');


    // Scrape description and category
    const possibleElements = $('#org_profile_info > ul > li');
    for (let i = 0; i < possibleElements.length; i++) {
      if (possibleElements[i].attribs.id) {
        continue;
      }

      const strong = $('strong', $(possibleElements[i]));

      if (!strong[0].next) {
        continue;
      }

      const strongText = strong.text().trim().replace(/:/gi, '').toLowerCase();

      const value = strong[0].next.data.trim();

      if (strongText === 'category') {
        obj.category = value;
      } else if (strongText === 'description') {
        obj.description = value;
      } else {
        macros.log('Unknown info box prop', strongText);
      }
    }


    if (Object.keys(obj).length < 3) {
      macros.log('Error', detailHtml);
    }

    return obj;
  }

  parseLetterAndPage(resp) {
    // Abstract Syntax Trees are the data structure that is used to parse programming languages (like javascript)
    // Like, the first step of running a programming language is to parse it into a AST
    // then preform a bunch of optimizations on it
    // and then compile it to machine code (if it is something like C)
    // or just run the AST directly (like python or js)
    // google for more info, feel free to log this directly
    const ast = acorn.parse(resp.body);

    // The reponse that we get back from that url is two lines of JS code
    // We are looking for the string arguments in the second line
    const html = ast.body[1].expression.arguments[0].value;

    // Dope, lets treat that as HTML and parse it
    const $ = cheerio.load(html);

    // Get all the a elements from it
    const elements = $('a');

    const detailsPageLinks = [];

    // Look through all the below elements
    for (let i = elements.length - 1; i >= 0; i--) {
      if (!elements[i].attribs || !elements[i].attribs.href || elements[i].attribs.href === '#' || !elements[i].attribs.href.includes('show_profile')) {
        continue;
      }

      detailsPageLinks.push(elements[i].attribs.href);
    }

    return detailsPageLinks;
  }


  async scrapeLetter(letter) {
    let totalOrgs = [];

    let pageNum = 1;

    // Each letter is pagenated
    // Increment the page number until hit a page with no results
    while (true) {
      // Scape the list of orgs from each page
      const resp = await request.post({ // eslint-disable-line no-await-in-loop
        shortBodyWarning: false,
        url: `http://neu.orgsync.com/search/get_orgs_by_letter/${letter.toUpperCase()}?page=${pageNum}`,
      });

      // And parse the results
      const detailsPageUrls = this.parseLetterAndPage(resp);

      // Parse the details from each link on the list of clubs page
      const promises = detailsPageUrls.map((url) => {
        return request.get({
          url: url,
          shortBodyWarning: false,
        }).then((detailResp) => {
          // And parse the results for each org
          return this.parseDetails(detailResp.body);
        });
      });

      // Wait for all the orgs to finish requesting and parsing
      const orgs = await Promise.all(promises); // eslint-disable-line no-await-in-loop

      macros.log(letter, 'page#', pageNum, 'had', orgs.length, 'orgs now at ', orgs.length);
      pageNum++;
      if (orgs.length === 0) {
        return totalOrgs;
      }

      if (pageNum > 30) {
        macros.error('Warning! Hit 30 page max, returning');
        return totalOrgs;
      }

      totalOrgs = totalOrgs.concat(orgs);
    }
  }


  async main() {
    let orgs = [];

    const promises = [];

    macros.ALPHABET.split('').forEach((letter) => {
      promises.push(this.scrapeLetter(letter).then((someOrgs) => {
        orgs = orgs.concat(someOrgs);
      }));
    });

    await Promise.all(promises);

    const outputPath = path.join(macros.PUBLIC_DIR, 'getClubs', 'neu.edu');

    await mkdirp(outputPath);

    await fs.writeFile(path.join(outputPath, 'data.json'), JSON.stringify(orgs));
    macros.log('done!', orgs.length, outputPath);
  }
}

const instance = new NeuClubs();


if (require.main === module) {
  instance.main();
}


export default instance;
