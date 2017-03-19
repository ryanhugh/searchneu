import request from 'superagent';
import cheerio from 'cheerio';
import fs from 'fs-promise';
import mkdirp from 'mkdirp-promise';
import path from 'path';
import URI from 'urijs';
import Throttle from 'superagent-throttle'

import macros from './macros';





// http://www.coe.neu.edu/connect/directory?field_faculty_type_value=faculty&letter=A
// 


async function scrapeDetailpage(obj) {
    
  const resp = await request.post(`http://www.ece.neu.edu/people/erdogmus-deniz`);

  const $ = cheerio.load(resp.text);
  debugger

  // full resolution image
  $('#faculty-profile > div.upper-content > div > div.left-content > a').attr('href')


  // linkedin link
  $('div.field-name-field-nucoe-social-link-url > div > div > a.linkedin').attr('href')

  $('div.field-name-field-nucoe-social-link-url > div > div > a.googlescholar').attr('href')

  
  $('div.field-name-field-nucoe-social-link-url > div > div > a.youtube').attr('href')

  // example of person who has multiple roles in departments
  // http://www.che.neu.edu/people/ebong-eno
  // Position and department
  $('div.field-collection-container > div.faculty-roles > div.faculty-roles__role',$(items[0]))

  // position (includes trailing comma)
  $('div.field-collection-container > div.faculty-roles > div.faculty-roles__role',$(items[0]))[0].children[0].data


  // department
    $('div.field-collection-container > div.faculty-roles > div.faculty-roles__role > a',$(items[0])).text()

// address
    $('div.faculty-profile__address').text().trim().replace(/[\n\r]+\s*/gi,'\n')

    // might be more than one of these, need to check .text() for each one
    // if text matches Faculty Website then get href 
    // also need to do head checks or get checks to make sure their site is up
    $($('div.field-name-field-faculty-links a')[0]).text()



  debugger


}




async function scrapeLetter(letter) {
  const resp = await request.post(`http://www.coe.neu.edu/connect/directory?field_faculty_type_value=faculty&letter=${letter.toUpperCase()}`);

  const $ = cheerio.load(resp.text);


  items =$('div.item-list > ul > li.views-row')

  // thumbnail image of them
  $('h4 > a > img',$(items[0])).attr('src')

  // link to their page
  $('h4 > a',$(items[0])).attr('href')

  // name of prof
  $('div.views-field.views-field-field-faculty-last-name > h4 > a',$(items[0])).text()



    // interests
      $('div.field-name-field-faculty-interests',$(items[0])).text()

      // email, inncludes mailto: in the beginning
        $('div.views-field-field-faculty-email > div.field-content > a',$(items[0])).attr('href')

        // phone. need to remove all non digits and then check length
          $('div.views-field-field-faculty-phone > div.field-content',$(items[0])).text()

  debugger






}



async function main() {

  scrapeDetailpage()
  return;


  scrapeLetter('a')
  return;

  var promises = []



  macros.ALPHABET.split('').forEach((letter) => {
    promises.push(scrapeLetter(letter))

  })


}


exports.go = main

if (require.main === module) {
  main();
}
