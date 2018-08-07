/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */


import cheerio from 'cheerio';

import cache from '../../cache';
import macros from '../../../macros';
import Request from '../../request';
import EllucianBaseParser from './ellucianBaseParser';
import ellucianClassListParser from './ellucianClassListParser';

const request = new Request('EllucianSubjectParser');

class EllucianSubjectParser extends EllucianBaseParser.EllucianBaseParser {
  supportsPage(url) {
    return url.indexOf('bwckgens.p_proc_term_date') > -1;
  }


  parse(body, url) {
    //parse the form data
    const formData = this.parseSearchPage(body, url);
    const subjects = [];

    formData.payloads.forEach((payloadVar) => {
      if (payloadVar.name !== 'sel_subj') {
        return;
      }

      if (!payloadVar.text || payloadVar.text === '') {
        return;
      }

      if (!payloadVar.value || payloadVar.value === '') {
        return;
      }

      //record all the subjects and their id's
      if (payloadVar.name === 'sel_subj') {
        subjects.push({
          id: payloadVar.value,
          text: payloadVar.text,
        });
      }
    });

    if (subjects.length === 0) {
      macros.log('ERROR, found 0 subjects??', url);
    }

    const outputSubjects = [];


    for (const subject of subjects) {
      outputSubjects.push({
        type: 'subjects',
        value: {
          subject: subject.id,
          text: subject.text,
        },
      });
    }

    return outputSubjects;
  }

  async addClassLists(subjects, url, termId) {
    const promises = [];


    subjects.forEach((subject) => {
      const classListUrl = this.createClassListUrl(url, termId, subject.value.subject);

      const promise = ellucianClassListParser.main(classListUrl).then((classes) => {
        subject.deps = classes;
      });

      promises.push(promise);
    });


    // Wait for all the class list promises.
    await Promise.all(promises);

    return subjects;
  }


  parseSearchPage(body, url) {
    // Parse the dom
    const $ = cheerio.load(body);

    const parsedForm = this.parseForm(url, $('body')[0]);

    //remove sel_subj = ''
    const payloads = [];

    //if there is an all given on the other pages, use those (and don't pick every option)
    //some sites have a limit of 2000 parameters per request, and picking every option sometimes exceeds that
    const allOptionsFound = [];

    parsedForm.payloads.forEach((entry) => {
      if (entry.name === 'sel_subj' && entry.value === '%') {
        return;
      }
      if (entry.value === '%') {
        allOptionsFound.push(entry.name);
      }
      payloads.push(entry);
    });


    const finalPayloads = [];

    //loop through again to make sure not includes any values which have an all set
    payloads.forEach((entry) => {
      if (allOptionsFound.indexOf(entry.name) < 0 || entry.value === '%' || entry.value === 'dummy') {
        finalPayloads.push(entry);
      }
    });

    return {
      postURL: parsedForm.postURL,
      payloads: finalPayloads,
    };
  }


  async main(url, termId) {
    const cacheKey = url + termId;

    // Possibly load from DEV
    if (macros.DEV && require.main !== module) {
      const devData = await cache.get(macros.DEV_DATA_DIR, this.constructor.name, cacheKey);
      if (devData) {
        return devData;
      }
    }

    const resp = await request.post({
      url: url,
      body: `p_calling_proc=bwckschd.p_disp_dyn_sched&p_term=${termId}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    let subjects = this.parse(resp.body, url);

    subjects = await this.addClassLists(subjects, url, termId);

    // macros.log(subjects)


    // Possibly save to dev
    if (macros.DEV) {
      await cache.set(macros.DEV_DATA_DIR, this.constructor.name, cacheKey, subjects);

      // Don't log anything because there would just be too much logging.
    }

    return subjects;
  }


  async test() {
    const retVal = await this.main('https://wl11gp.neu.edu/udcprod8/bwckgens.p_proc_term_date', 201810);
    macros.log(retVal);
  }
}


EllucianSubjectParser.prototype.EllucianSubjectParser = EllucianSubjectParser;
const instance = new EllucianSubjectParser();

if (require.main === module) {
  instance.testFunc();
}

export default instance;
