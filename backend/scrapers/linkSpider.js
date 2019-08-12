/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import cheerio from 'cheerio';
import URI from 'urijs';

import Request from './request';
import macros from '../macros';

const request = new Request('LinkSpider');


// Starts spidering website(s) from a list of given URLs.
// Will follow [depth] number of links away from any of the given urls.
// Collects and returns every url found on any page.
// Does not spider to any domain not found in one of the input urls

// Example
// If page 1 links to page 2 which links to page 3 which links to page 4
// if depth is 1, and page 1 is given it will return page 2 and page 3
// and request page 1 and 2.


// Takes in a list of URLs eg.
// [
//   'https://camd.northeastern.edu/architecture/faculty-staff',
//   'https://camd.northeastern.edu/music/faculty-staff',
//   'https://camd.northeastern.edu/theatre/faculty-staff',
// ]
// and a integer.
// Returns a list of URLs.
class LinkSpider {
  async main(inputUrls, depth = 1) {
    if (!inputUrls || inputUrls.length === 0) {
      macros.error('Link Spider needs a starting url');
      return null;
    }

    const validHostnames = {};

    inputUrls.forEach((url) => {
      validHostnames[new URI(url).hostname()] = true;
    });


    const history = {};
    let urlStack = inputUrls.slice(0);
    const returnUrls = [];

    while (depth > 0) {
      const promises = [];

      // Get all the links from all of the URLs
      for (const url of urlStack) {
        promises.push(request.get(url));
      }

      // The eslint ignore is required and this is correct code
      // Usually, in programming, awaiting in a loop is bad code, but this is intentional.
      const responses = await Promise.all(promises); // eslint-disable-line no-await-in-loop

      const linksOnPages = [];

      responses.forEach((resp) => {
        const $ = cheerio.load(resp.body);
        const elements = $('a');
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          const url = $(element).attr('href');
          if (!url) {
            continue;
          }
          const newHost = new URI(url).hostname();


          // If this link is to a different site, ignore.
          if (!validHostnames[newHost]) {
            continue;
          }

          // Already saw this url, continue
          if (history[url]) {
            continue;
          }

          history[url] = true;

          linksOnPages.push(url);
          returnUrls.push(url);
        }
      });

      urlStack = linksOnPages;
      depth--;
    }

    return returnUrls;
  }


  async test() {
    // const output = await this.main('https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201810&subj_code_in=FINA&crse_numb_in=6283');
    // const output = await this.main('https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201810&subj_code_in=ENGW&crse_numb_in=3302');
    const output = await this.main(['https://google.com']);
    macros.log('output:', JSON.stringify(output, null, 4));
  }
}


const instance = new LinkSpider();

if (require.main === module) {
  instance.test();
}

export default instance;
