/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import cheerio from 'cheerio';

import Request from '../request';
import cache from '../cache';
import macros from '../../macros';

const request = new Request('COE');

// TODO

// Could parse a lot more from each page
// Phone numbers with extentions are not parsed http://www.civ.neu.edu/people/patterson-mark


// This was removed from matchEmployees.js, but when its re-written just add it back.
// https://github.com/ryanhugh/searchneu/issues/95

class COE {
  parsePeopleList(resp) {
    let $ = cheerio.load(resp.body);

    const people = $('.grid--4 > div > div').get().map((person) => {
      $ = cheerio.load(person);
      const obj = {};

      const name = $('h2 > a').get(0).children[0].data;
      if (name) {
        obj.name = name;
      } else {
        macros.log('Could not parse name');
      }

      //console.log(name);

      const { firstName, lastName } = macros.parseNameWithSpaces(obj.name);

      if (firstName && lastName) {
        obj.firstName = firstName;
        obj.lastName = lastName;
      }

      const link = $('h2 > a').get(0).attribs.href;
      if (link) {
        obj.link = link;
      } else {
        macros.log('Could not parse link');
      }

      let title = $('div.caption').get(0).children[0].data.trim();
      title = title.replace(/,$/i, '');
      if (title) {
        obj.title = title;
      } else {
        macros.log('Could not parse title');
      }
      const email = macros.standardizeEmail($('ul.caption > li > a').get(0).children[0].data);
      if (email) {
        obj.email = email;
      } else {
        macros.log('Could not parse email');
      }
      const phone = $('ul.caption > li').get(1).children[0];
      if (phone) {
        obj.phone = macros.standardizePhone(phone.data);
      } else {
        macros.log('Could not parse phone');
      }

      return obj;
    });

    return people;
  }

  async main() {
    if (macros.DEV && require.main !== module) {
      const devData = await cache.get(macros.DEV_DATA_DIR, this.constructor.name, 'main');
      if (devData) {
        return devData;
      }
    }

    const resp = await request.get('https://coe.northeastern.edu/faculty-staff-directory/?display=all');
    //console.log(JSON.stringify(resp));
    const peopleObjects = this.parsePeopleList(resp);

    if (macros.DEV) {
      await cache.set(macros.DEV_DATA_DIR, this.constructor.name, 'main', peopleObjects);
      macros.log(peopleObjects.length, 'coe people saved!');
    }

    macros.log('done');
    return peopleObjects;
  }
}

const instance = new COE();
export default instance;

if (require.main === module) {
  instance.main();
}
