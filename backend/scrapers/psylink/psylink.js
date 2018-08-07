/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import cheerio from 'cheerio';
import cookie from 'cookie';

import baseParser from '../classes/parsers/baseParser';
import Request from '../request';
import macros from '../../macros';
import notifyer from '../../notifyer';

const request = new Request('psylink');


// Scraper for http://psylink.psych.neu.edu/ to get the list of avalible studies.
// Requires login, but the login is different than the login for MyNEU
// if this breaks, there are a couple things that couple be tweaked
// like the submit.x and the submit.y in the login post request (get actuall values an not just hardcode)
// but it works at the moment!


class Psylink {
  constructor() {
    this.lastData = {};
  }

  async login() {
    const username = await macros.getEnvVariable('psylinkUsername');
    const password = await macros.getEnvVariable('psylinkPassword');

    const response = await request.post({
      url: 'http://psylink.psych.neu.edu/loginproc.php',
      simple: false,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `username=${username}&password=${password}&submit.x=30&submit.y=13`,
    });

    const theCookie = cookie.parse(response.headers['set-cookie'][0]);


    return theCookie.PHPSESSID;
  }

  async scrape() {
    const theCookie = await this.login();

    // Hit the list of avalible studies.
    const resp2 = await request.get({
      url: 'http://psylink.psych.neu.edu/main.php?item=1',
      simple: false,
      headers: {
        Cookie: `PHPSESSID=${theCookie}`,
      },
    });

    // macros.log(resp2.body)

    const $ = cheerio.load(resp2.body);


    const table = $('body > table > tr > td > table:nth-child(2) > tr:nth-child(2) > td > table');

    const output = baseParser.parseTable(table[0]);

    const retVal = [];

    for (let i = 0; i < output.rowCount; i++) {
      const row = {};

      row.date = output.tableData.date[i];
      row.time = output.tableData.time[i];
      row.expname = output.tableData.expname[i];
      row.expcode = output.tableData.expcode[i];
      row.researchername = output.tableData.researchername[i];
      row.labphone = output.tableData.labphone[i];
      row.expdescrip = output.tableData.expdescrip[i];
      row.expnotes = output.tableData.expnotes[i];


      row.hash = row.date + row.time;

      retVal.push(row);
    }

    // macros.log(JSON.stringify(retVal, null, 4))

    return retVal;
  }


  async onInterval(sendNotifications = true) {
    const thisData = await this.scrape();

    macros.log('Scraped. Got ', thisData.length, 'labs');

    const lastData = this.lastData;

    const newData = {};

    for (const row of thisData) {
      newData[row.hash] = row;
      if (lastData[row.hash]) {
        continue;
      }

      if (sendNotifications) {
        // Got a new lab!
        macros.log('got a new lab!!!');

        notifyer.sendFBNotification('1397905100304615', `New lab!${row.date} ${row.time}\n http://psylink.psych.neu.edu/login.php`);
      }
    }

    this.lastData = newData;
  }


  // startWatch() {
  //   if (!macros.PROD) {
  //     return;
  //   }
  //   return;

  // Run once to get initial state
  // this.onInterval(false);

  // // 5 Min in ms
  // setInterval(this.onInterval.bind(this), 300000);
  // }

  main() {
    return this.login();
  }
}


const instance = new Psylink();
export default instance;

if (require.main === module) {
  instance.main();
}
