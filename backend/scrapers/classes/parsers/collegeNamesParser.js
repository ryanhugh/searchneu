/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

// The point of this file is to get the name of a college from the hostname of their domain
// Eg neu.edu -> Northeastern University
// Couple different ways to do this
// 1. There is a data dump for 7000 Universities created in 2013 that has many colleges in it.
//     This was found here https://inventory.data.gov/dataset/032e19b4-5a90-41dc-83ff-6e4cd234f565/resource/38625c3d-5388-4c16-a30f-d105432553a4
//     and is rehosted here: https://github.com/ryanhugh/coursepro/blob/master/docs/universities%20in%202013.csv
//     This file, however, sometimes lists different colleges in the same University on the spreadsheet. Probably want manually investigate if there is > 1 row that lists a given domain
//     Might be able to find the minimum overlap in the college name
// 2. Hit whois. This has been suprisingly unreliable over the last couple years. Sometimes the whois server switches, etc.
// 3. Hit the website and inspect the https certificate.
// 4. https://github.com/leereilly/swot
// 5. https://nc.me/faq (click the button that shows list of colleges)
// 5. Hit the website and find the <title> in the html. This is the least reliable of all of them. (Look in git history for a function that did this; it has since been removed. )
// Once have a name for a given college, can store forever because it is not going to change.


import asyncjs from 'async';
import whois from 'whois';

import macros from '../../../macros';
import cache from '../../cache';
import BaseParser from './baseParser';


class CollegeNamesParser extends BaseParser.BaseParser {
  async main(hostname) {
    if (macros.DEV && require.main !== module) {
      const devData = await cache.get(macros.DEV_DATA_DIR, this.constructor.name, hostname);
      if (devData) {
        return devData;
      }
    }

    const title = await this.getTitle(hostname);

    if (macros.DEV) {
      await cache.set(macros.DEV_DATA_DIR, this.constructor.name, hostname, title);
      macros.log('CollegeNamesParser file saved!');
    }

    return title;
  }


  standardizeNames(startStrip, endStrip, title) {
    //remove stuff from the beginning
    startStrip.forEach((str) => {
      if (title.toLowerCase().indexOf(str) === 0) {
        title = title.substr(str.length);
      }
    });


    //remove stuff from the end
    endStrip.forEach((str) => {
      const index = title.toLowerCase().indexOf(str);
      if (index === title.length - str.length && index > -1) {
        title = title.substr(0, title.length - str.length);
      }
    });


    // standardize the case
    title = this.toTitleCase(title);

    return title.trim();
  }


  hitWhois(host) {
    //each domain has a different format and would probably need a different regex
    //this one works for edu and ca, but warn if find a different one
    const hostSplitByDot = host.split('.');
    if (!['ca', 'edu'].includes(hostSplitByDot[hostSplitByDot.length - 1])) {
      macros.log(`Warning, unknown domain ${host}`);
    }

    return new Promise((resolve, reject) => {
      // try calling apiMethod 3 times, waiting 200 ms between each retry
      asyncjs.retry(
        {
          times: 30,
          interval: 500 + parseInt(Math.random() * 1000, 10),
        },
        (callback) => {
          whois.lookup(host, (err, data) => {
            callback(err, data);
          });
        },
        (err, data) => {
          if (err) {
            macros.error('whois error', err, host);
            reject(err);
            return;
          }


          const match = data.match(/Registrant:\n[\w\d\s&:']+?(\n)/i);

          if (!match) {
            macros.error('whois regex fail', data, host);
            reject(err);
            return;
          }

          let name = match[0].replace('Registrant:', '').trim();


          name = this.standardizeNames(['name:'], [], name);


          if (name.length < 2) {
            macros.error(err);
            reject(err);
            return;
          }

          resolve(name);
        },
      );
    });
  }

  //hits database, and if not in db, hits page and adds it to db
  getTitle(host) {
    if (host === 'neu.edu') {
      return 'Northeastern University';
    }

    return this.hitWhois(host);
  }
}


CollegeNamesParser.prototype.CollegeNamesParser = CollegeNamesParser;
export default new CollegeNamesParser();
