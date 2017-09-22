/*
 * Copyright (c) 2017 Ryan Hughes
 *
 * This file is part of CoursePro.
 *
 * CoursePro is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License
 * version 3 as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import _ from 'lodash';
import he from 'he';
import URI from 'urijs';
import cheerio from 'cheerio';

import cache from '../../cache';
import macros from '../../../macros';
import Request from '../../request';
import EllucianBaseParser from './ellucianBaseParser';
import ellucianCatalogParser from './ellucianCatalogParser';


const request = new Request('EllucianClassListParser');

class EllucianClassListParser extends EllucianBaseParser.EllucianBaseParser {


  supportsPage(url) {
    return url.indexOf('bwckctlg.p_display_courses') > -1;
  }


  //
  async main(url) {
    // Possibly load from DEV
    if (macros.DEV && require.main !== module) {
      const devData = await cache.get('dev_data', this.constructor.name, url);
      if (devData) {
        return devData;
      }
    }

    const resp = await request.get(url);

    const catalogUrls = this.parse(resp.body, url);


    let classesObjects = await Promise.all(catalogUrls.map((catalogUrl) => {
      return ellucianCatalogParser.main(catalogUrl);
    }));

    // If there were any errors and ellucianCatalogParser.main returned null, continue. 
    _.pull(classesObjects, null)

    // So the catalog parser returns a list of classes it found at that catalog url.
    // So flatten the array to just have a list of classes
    // These are not the classes objects directly, they are the wrappers around them.
    classesObjects = _.flatten(classesObjects);


   // Possibly save to dev
    if (macros.DEV && require.main !== module) {
      await cache.set('dev_data', this.constructor.name, url, classesObjects);

      // Don't log anything because there would just be too much logging.
    }

    return classesObjects;
  }


  parse(body, originalUrl) {
    // Parse the dom
    const $ = cheerio.load(body);

    const aElements = $('a');

    const classUrls = [];

    for (let i = 0; i < aElements.length; i++) {
      const element = aElements[i];

      if (!element.attribs.href) {
        continue;
      }

      let url = he.decode(element.attribs.href);

      if (url.startsWith('javascript') || url.startsWith('mailto')) {
        continue;
      }

      // Fix broken urls. (Have seen this on NEU's site :/)
      if (url.startsWith('http: //')) {
        url = `http://${url.slice('http: //'.length)}`;
      }

      try {
        url = new URI(url).absoluteTo(originalUrl).toString();
      } catch (e) {
        macros.error('Ran into an error while parsing a url. Skipping.', e, url, JSON.stringify(element.attribs), url);
        continue;
      }

      if (!url) {
        continue;
      }


      if (ellucianCatalogParser.supportsPage(url)) {
        classUrls.push(url);
      }
    }

    return classUrls;
  }

  async test() {
    const output = await this.main('https://wl11gp.neu.edu/udcprod8/bwckctlg.p_display_courses?sel_crse_strt=&sel_crse_end=&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr=&term_in=201810&one_subj=FINA');
    console.log(output);
  }

}


EllucianClassListParser.prototype.EllucianClassListParser = EllucianClassListParser;
const instance = new EllucianClassListParser();

if (require.main === module) {
  instance.test();
}

export default instance;
