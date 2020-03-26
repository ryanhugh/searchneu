/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import cheerio from 'cheerio';
import _ from 'lodash';

import Request from '../request';
import cache from '../cache';
import macros from '../../macros';

const request = new Request('COE');

// TODO
// Could parse a lot more from each page
// Phone numbers with extentions are not parsed http://www.civ.neu.edu/people/patterson-mark


class COE {
  parsePeopleList(resp) {
    let $ = cheerio.load(resp.body);

    const people = $('.grid--4 > div > div').get().map((person) => {
      $ = cheerio.load(person);
      const obj = {};

      const name = $('h2 > a').get(0).children[0].data;
      if (name) {
        obj.name = name;
      }

      const splitName = macros.parseNameWithSpaces(obj.name);
      if (!splitName) {
        return null;
      }

      const { firstName, lastName } = splitName;
      if (firstName && lastName) {
        obj.firstName = firstName;
        obj.lastName = lastName;
      }

      const link = $('h2 > a').get(0).attribs.href;
      if (link) {
        obj.link = link;
      }

      let title = $('div.caption').get(0).children[0].data.trim();
      title = title.replace(/,$/i, '');
      if (title) {
        obj.title = title;
      }

      const interests = $('div.caption').get(1);
      if (interests) {
        obj.interests = interests.children[0].data;
      }

      const email = macros.standardizeEmail($('ul.caption > li > a').get(0).children[0].data);
      if (email) {
        obj.email = email;
      }

      const phone = $('ul.caption > li').get(1).children[0];
      if (phone) {
        obj.phone = macros.standardizePhone(phone.data);
      }

      const pic = $('img').get(0).attribs;
      if (pic) {
        obj.pic = pic;
      }

      ['name', 'link', 'title', 'interests', 'email', 'phone', 'pic'].forEach((attrName) => {
        if (!obj[attrName]) {
          macros.log('Could not parse', attrName, 'for', obj.name ? obj.name : 'someone with no name');
        }
      });

      return obj;
    });

    return _.pull(people, null);
  }

  async main() {
    if (macros.DEV && require.main !== module) {
      const devData = await cache.get(macros.DEV_DATA_DIR, this.constructor.name, 'main');
      if (devData) {
        return devData;
      }
    }

    const resp = await request.get('https://coe.northeastern.edu/faculty-staff-directory/?display=all');
    //console.log(JSON.stringify(resp));
    const peopleObjects = this.parsePeopleList(resp);

    if (macros.DEV) {
      await cache.set(macros.DEV_DATA_DIR, this.constructor.name, 'main', peopleObjects);
      macros.log(peopleObjects.length, 'coe people saved!');
    }

    macros.log('done');
    return peopleObjects;
  }
}

const instance = new COE();
export default instance;

if (require.main === module) {
  instance.main();
}
