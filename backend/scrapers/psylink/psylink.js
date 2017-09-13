import cheerio from 'cheerio';
import path from 'path';
import cookie from 'cookie'

import baseParser from '../classes/parsers/baseParser'
import Request from '../request';
import macros from '../../macros';
import cache from '../cache';

const request = new Request('psylink');


// Scraper for http://psylink.psych.neu.edu/ to get the list of avalible studies.
// Requires login, but the login is different than the login for MyNEU
// if this breaks, there are a couple things that couple be tweaked
// like the submit.x and the submit.y in the login post request (get actuall values an not just hardcode)
// but it works at the moment!


class Psylink {
  
  async login () {
    
    let username = await macros.getEnvVariable('psylinkUsername')
    let password = await macros.getEnvVariable('psylinkPassword')
    
    let response = await request.post({
      url: 'http://psylink.psych.neu.edu/loginproc.php',
      simple: false,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'username=' + username + '&password=' + password + '&submit.x=30&submit.y=13'
    })
    
    let theCookie = cookie.parse(response.headers['set-cookie'][0]);
    
    
    
    // Hit the list of avalible studies. 
    let resp2 = await request.get({
      url: 'http://psylink.psych.neu.edu/main.php?item=1',
      simple: false,
      headers: {
        Cookie: 'PHPSESSID=' + theCookie.PHPSESSID
      }})
      
    // console.log(resp2.body)
    
    let $ = cheerio.load(resp2.body);
    
    
    let table = $('body > table > tr > td > table:nth-child(2) > tr:nth-child(2) > td > table')
    
    let output= baseParser.parseTable(table[0])
    
    let retVal = []
    
    for (let i =0;i<output.rowCount;i++) {
      let row = {}
      
      row.date = output.tableData.date[i]
      row.time = output.tableData.time[i]
      row.expname = output.tableData.expname[i]
      row.expcode = output.tableData.expcode[i]
      row.researchername = output.tableData.researchername[i]
      row.labphone = output.tableData.labphone[i]
      row.expdescrip = output.tableData.expdescrip[i]
      row.expnotes = output.tableData.expnotes[i]
      retVal.push(row)
    }
    
    return retVal;
    
    // return theCookie.PHPSESSID
    
  }
  
  
  
  async getExperiments() {
    
    let theCookie = this.login();
    
    // let response = await request.get({
    //   url: 'http://psylink.psych.neu.edu/main.php?item=1',
    //   headers: {
    //     Cookie: 'PHPSESSID=' + theCookie
    //   }
    // })
    
    // console.log(response.body)
    
    
  }
  
  main() {
    return this.login()
  }
  
  
  
  
}




const instance = new Psylink();
export default instance;

if (require.main === module) {
  instance.main();
}

