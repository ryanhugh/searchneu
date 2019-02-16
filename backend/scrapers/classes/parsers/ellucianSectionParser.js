/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import cheerio from 'cheerio';
import domutils from 'domutils';

import cache from '../../cache';
import Request from '../../request';
import macros from '../../../macros';
import ellucianBaseParser from './ellucianBaseParser';
import ellucianRequisitesParser from './ellucianRequisitesParser';


const request = new Request('EllucianSectionParser');


//700+ college sites use this poor interface for their registration
//good thing tho, is that it is easily scrape-able and does not require login to access seats available

class EllucianSectionParser extends ellucianBaseParser.EllucianBaseParser {
  async main(url) {
    // Possibly load from DEV
    if (macros.DEV && require.main !== module) {
      const devData = await cache.get(macros.DEV_DATA_DIR, this.constructor.name, url);
      if (devData) {
        return devData;
      }
    }

    const resp = await request.get(url);

    const retVal = this.parse(resp.body, url);

    // Possibly save to dev
    if (macros.DEV && require.main !== module) {
      await cache.set(macros.DEV_DATA_DIR, this.constructor.name, url, retVal);

      // Don't log anything because there would just be too much logging.
    }

    return retVal;
  }


  supportsPage(url) {
    return url.indexOf('bwckschd.p_disp_detail_sched') > -1;
  }


  parse(body, url) {
    // Parse the dom
    const $ = cheerio.load(body);


    // Find the table that has seats remaining and seats taken.
    const allTables = $('td > table.datadisplaytable');

    let matchingTable;

    for (let i = 0; i < allTables.length; i++) {
      const table = $(allTables[i]);

      const summary = table.attr('summary');

      // Skip any tables that don't have "seating" in the table.attr('summary')
      if (!summary || !summary.includes('seating')) {
        continue;
      }

      if (matchingTable) {
        macros.error('Already found a matching table?', url);
        return {};
      }

      matchingTable = table;
    }

    if (!matchingTable) {
      macros.error('Table did not include seating string', allTables.length, body.length, body);
      return {};
    }


    const element = matchingTable[0];


    const retVal = {};
    const { tableData, rowCount } = this.parseTable(element);

    if (!tableData || rowCount === 0 || !tableData.capacity || !tableData.actual || !tableData.remaining) {
      macros.error('ERROR: invalid table in section parser', tableData, url);
      return {};
    }

    // Don't need to store all 3 of these numbers. Verify that 2 of them add up to the other one, and then just store 2 of them.
    let seatsCapacity = parseInt(tableData.capacity[0], 10);
    const seatsActual = parseInt(tableData.actual[0], 10);
    const seatsRemaining = parseInt(tableData.remaining[0], 10);

    if (seatsActual + seatsRemaining !== seatsCapacity) {
      macros.log('warning, actual + remaining !== capacity', seatsCapacity, seatsActual, seatsRemaining, url);

      // Oddly enough, sometimes this check fails.
      // In this case, use the greater number for capacity.
      // https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201630&crn_in=31813
      // https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201630&crn_in=38114
      if (seatsCapacity < seatsActual + seatsRemaining) {
        seatsCapacity = seatsActual + seatsRemaining;
      }
    }

    if (seatsCapacity === undefined) {
      macros.error('Error when parsing seat capacity.', url);
      return {};
    }

    if (seatsRemaining === undefined) {
      macros.error('Error when parsing seatsRemaining.', url);
      return {};
    }

    retVal.seatsCapacity = seatsCapacity;
    retVal.seatsRemaining = seatsRemaining;

    if (rowCount > 1) {
      let waitCapacity = parseInt(tableData.capacity[1], 10);
      const waitActual = parseInt(tableData.actual[1], 10);
      const waitRemaining = parseInt(tableData.remaining[1], 10);

      if (waitActual + waitRemaining !== waitCapacity) {
        macros.log('warning, wait actual + remaining !== capacity', waitCapacity, waitActual, waitRemaining, url);

        if (waitCapacity < waitActual + waitRemaining) {
          waitCapacity = waitActual + waitRemaining;
        }
      }

      retVal.waitCapacity = waitCapacity;
      retVal.waitRemaining = waitRemaining;
    }


    //third row is cross list seats, rarely listed and not doing anyting with that now
    // https://ssb.ccsu.edu/pls/ssb_cPROD/bwckschd.p_disp_detail_sched?term_in=201610&crn_in=12532


    const termId = this.getTermIdFromUrl(url);

    if (!termId) {
      macros.error('Unable to find term id from url?', url);
      return {};
    }


    //find co and pre reqs and restrictions
    const prereqs = ellucianRequisitesParser.parseRequirementSection(url, element.parent.children, 'prerequisites');

    const coreqs = ellucianRequisitesParser.parseRequirementSection(url, element.parent.children, 'corequisites');

    if (prereqs) {
      retVal.prereqs = prereqs;
    }

    if (coreqs) {
      retVal.coreqs = coreqs;
    }

    //grab credits
    const text = domutils.getText(element.parent).toLowerCase();
    const creditsParsed = this.parseCredits(text);

    if (creditsParsed) {
      retVal.maxCredits = creditsParsed.maxCredits;
      retVal.minCredits = creditsParsed.minCredits;
    } else {
      macros.log('warning, nothing matchied credits', url, text);
    }


    // This is specific for NEU for now.
    // Other colleges probably do it a little differently.
    // Could probably figure out online vs not online easily.. but not sure.
    if (macros.getBaseHost(url) === 'neu.edu') {
      // Possible values for campus
      // Different campuses are not done yet.
      // But this where the code would go
      // <OPTION VALUE="%" SELECTED>All
      // <OPTION VALUE="BOS">Boston
      // <OPTION VALUE="BRD">Boston
      // <OPTION VALUE="BRL">Burlington
      // <OPTION VALUE="CHL">Charlotte, NC
      // <OPTION VALUE="DDH">Dedham
      // <OPTION VALUE="NAH">Nahant
      // <OPTION VALUE="SEA">Seattle, WA
      // <OPTION VALUE="TOR">Toronto, Canada
      // <OPTION VALUE="VTL">Online

      // const possibleCampuses = {

      //   // This one is kindof weird. It is used when the class does not occur in a classroom.
      //   // For example, Music Lessons, Independant study, Directed Study, Research, etc
      //   // Where all the teaching/learning would probably happen just 1:1 somewhere on campus,
      //   // but in some cases it could happen remotely too.
      //   'no campus, no room needed campus': 'Boston',
      //   'burlington campus': 'Burlington',
      //   'boston, main campus': 'Boston',
      //   'boston campus': 'Boston',
      //   'seattle, wa campus': 'Seattle',
      // };


      // Grab whether the class is an online class or not
      const onlineCampus = text.includes('online campus');
      if (onlineCampus) {
        retVal.online = true;
      } else {
        retVal.online = false;
      }
    }


    // HONORS NOTES
    // swathmore and sju have "honors" in title
    // https://myswat.swarthmore.edu/pls/bwckschd.p_disp_detail_sched?term_in=201602&crn_in=25340
    // https://myswat.swarthmore.edu/pls/bwckctlg.p_disp_course_detail?cat_term_in=201602&subj_code_in=MATH&crse_numb_in=016H
    // https://ssb.sju.edu/pls/PRODSSB/bwckctlg.p_disp_course_detail?cat_term_in=201610&subj_code_in=CHM&crse_numb_in=126

    // clemson has Honors in attributes
    // HOWEVER it also has a "includes honors sections" in the dsecription
    // https://sisssb.clemson.edu/sisbnprd/bwckschd.p_disp_detail_sched?term_in=201608&crn_in=87931

    // gatech has honors in title
    // neu has it in attributes, as different sections in same class
    // https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=201710&subj_in=CS&crse_in=1800&schd_in=LEC
    //
    // TLDR: class.honors = sectionHtml.includes('honors')

    // grab honors (honours is canadian spelling)
    if (text.includes('honors') || text.includes('honours')) {
      retVal.honors = true;
    } else {
      retVal.honors = false;
    }
    return retVal;
  }

  async test() {
    const output = await this.main('https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201810&crn_in=14579');
    macros.log(output);
  }
}


//this allows subclassing, http://bites.goodeggs.com/posts/export-this/ (Mongoose section)
EllucianSectionParser.prototype.EllucianSectionParser = EllucianSectionParser;
const instance = new EllucianSectionParser();

if (require.main === module) {
  instance.main();
}

export default instance;
