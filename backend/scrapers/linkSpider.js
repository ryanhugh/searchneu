/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import cheerio from 'cheerio';
import URI from 'urijs';

import Request from './request';
import macros from '../macros';

const request = new Request('LinkSpider');

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
}

export default new LinkSpider();
