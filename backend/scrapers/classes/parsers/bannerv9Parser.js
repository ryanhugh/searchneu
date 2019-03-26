/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import moment from 'moment';
import cheerio from 'cheerio';

import cache from '../../cache';
import macros from '../../../macros';
import Request from '../../request';

const request = new Request('bannerv9Parser');


class Bannerv9Parser {
  parse(body, url) {
    macros.log(moment, cheerio, body, url);

    // TODO: write
    // body is the response from https://nubanner.neu.edu/StudentRegistrationSsb/ssb/registration
    // This method should be synchronous, which makes it much easier to test and develop
    // the body paremeter is the body of the response of the page
    // if you need other response information too (like Set-Cookie headers we can get that stuff too)
    // this method doesn't have to use the url parameter
    // The only places I tend to use it is for logging - if something breakes I log the url so I can see what url broke stuff
    // but if it works the url paremeter isn't used.
    // use cheerio to parse out the data you want (
    // including urls (or any data, really) that you want to pass to other parsers
    // In some of the existing processors I send the url and some parameters for a post request to make to that url
    // at the end of this method just return everything you want to keep from parsing the body
    // and just return everything
    // Check out the other parsers for examples
    return {};
  }

  // This method that
  async main(url) {
    // Possibly load from DEV
    if (macros.DEV && require.main !== module) {
      const devData = await cache.get(macros.DEV_DATA_DIR, this.constructor.name, url);
      if (devData) {
        return devData;
      }
    }

    // Request the url
    // If you want to spider a site, you can use LinkSpider.js

    // If you need to deal with cookies, check out scrapers/employees/employee.js
    // which gets a cookie from one page before any other requests will work
    // If you need more advanced cookie management or cookie jar stuff we could build that out somehow
    const resp = await request.get(url);

    // TODO: write this method
    const output = this.parse(resp.body, url);

    macros.log(output);


    // TOD: Run any other parsers you want to run
    // All of the other existing parsers run 0 or 1 other parsers, but you can run any number
    // just keep it managable

    // let outputFromOtherParsers = await someOtherParser.main(urlOrSomeData);

    // TODO: merge the data from outputFromOtherParsers with the output from this parser.

    const mergedOutput = {};


    // Possibly save the mergedOutput to disk so we don't have to run all this again
    if (macros.DEV && require.main !== module) {
      await cache.set(macros.DEV_DATA_DIR, this.constructor.name, url, mergedOutput);

      // Don't log anything because there would just be too much logging.
    }

    return mergedOutput;
  }


  // Just a convient test method, if you want to
  async test() {
    const output = await this.main('https://nubanner.neu.edu/StudentRegistrationSsb/ssb/registration');
    macros.log(output);
  }
}


Bannerv9Parser.prototype.Bannerv9Parser = Bannerv9Parser;
const instance = new Bannerv9Parser();


if (require.main === module) {
  instance.test();
}

export default instance;
