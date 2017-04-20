import request from './request';
import htmlparser from 'htmlparser2';
import domutils from 'domutils';
import _ from 'lodash';
import cookie from 'cookie';
import path from 'path';
import he from 'he';

import utils from './utils';
import macros from './macros';


// Scrapes from here: https://prod-web.neu.edu/wasapp/employeelookup/public/main.action

// TODO:
// Some of the phone numbers are not 10 digits. Might be able to guess area code, but it is not allways 215 just because some people have offices outside of Boston.
// Phone numbers that are not 10 digits are ignored right now.


// Currently:
// Name is always scraped. This can vary slightly between different data sources.
// This name will never include accents, which the CCIS site does
// Also, multiple people have the same name so this can not be used as a primary key
// "name": "Hauck, Heather",

// Id of each employee. Always scraped.
// "id": "000120097",

// Phone number. Some people had them posted and others did not. Sometimes present, sometimes not.
// The same phone number can be listed as one person's phone number on this data source and a different person on a different data source.
// Don't have a great idea on how to handle that.
// "phone": "6173737821",

// Email. Sometimes present, sometimes not.
// "email": "h.hauck@northeastern.edu",

// Sometimes present, sometimes not. Often heavily abbreviated. (like this example)
// "primaryappointment": "Asst Dir &amp; Assoc Coop Coord",

// Always scraped.
// "primarydepartment": "DMSB Co-op"


function handleRequestResponce(body, callback) {
  const handler = new htmlparser.DomHandler(callback);
  const parser = new htmlparser.Parser(handler);
  parser.write(body);
  parser.done();
}


//returns a {colName:[values]} where colname is the first in the column
//regardless if its part of the header or the first row of the body
function parseTable(table) {
  if (table.name !== 'table') {
    console.warn('parse table was not given a table..');
    return null;
  }

  //includes both header rows and body rows
  const rows = domutils.getElementsByTagName('tr', table);

  if (rows.length === 0) {
    return null;
  }


  const retVal = {};
  const heads = [];

  //the headers
  rows[0].children.forEach((element) => {
    if (element.type !== 'tag' || ['th', 'td'].indexOf(element.name) === -1) {
      return;
    }

    const text = domutils.getText(element).trim().toLowerCase().replace(/\s/gi, '');
    retVal[text] = [];
    heads.push(text);
  });


  //add the other rows
  rows.slice(1).forEach((row) => {
    let index = 0;
    row.children.forEach((element) => {
      if (element.type !== 'tag' || ['th', 'td'].indexOf(element.name) === -1) {
        return;
      }
      if (index >= heads.length) {
        console.log('warning, table row is longer than head, ignoring content', index, heads, rows);
        return;
      }

      retVal[heads[index]].push(domutils.getText(element).trim());

      //only count valid elements, not all row.children
      index++;
    });


    //add empty strings until reached heads length
    for (; index < heads.length; index++) {
      retVal[heads[index]].push('');
    }
  });
  return {
    rowCount: rows.length - 1,
    parsedTable: retVal,
  };
}

const people = [];
const peopleMap = {};

let cookiePromise = null;

async function getCookiePromise() {
  if (cookiePromise) {
    return cookiePromise;
  }
  
  utils.verbose('neu employee getting cookie');

  cookiePromise = request.get({
    url: 'https://prod-web.neu.edu/wasapp/employeelookup/public/main.action'
  }).then(function (resp) {
    
    // Parse the cookie from the response
    const cookieString = resp.headers['set-cookie'][0];
    const cookies = cookie.parse(cookieString);
    utils.verbose('got cookie')
    return cookies.JSESSIONID  
  })
  
  return cookiePromise
}


function hitWithLetters(lastNameStart, jsessionCookie) {
  const reqBody = `searchBy=Last+Name&queryType=begins+with&searchText=${lastNameStart}&deptText=&addrText=&numText=&divText=&facStaff=1`;
  return request.post({
    url: 'https://prod-web.neu.edu/wasapp/employeelookup/public/searchEmployees.action',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: `JSESSIONID=${jsessionCookie}`,
    },
    body: reqBody,
  })
}

function parseLettersResponse(response) {
  return new Promise((resolve, reject) => {
    handleRequestResponce(response.body, (err, dom) => {
      const elements = domutils.getElementsByTagName('table', dom);
      
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];

        const goal = {
          width: '100%',
        };

        if (_.isEqual(element.attribs, goal)) {
          // Delete one of the elements that is before the header that would mess stuff up
          domutils.removeElement(element.children[1].children[1]);

          const tableData = parseTable(element);


          if (!tableData) {
            return resolve();
          }

          const parsedTable = tableData.parsedTable;
          const rowCount = tableData.rowCount;

          console.log('Found', rowCount, ' people on page ', response.request.uri.href);

          for (let j = 0; j < rowCount; j++) {
            const person = {};
            person.name = parsedTable.name[j].split('\n\n')[0];

            const idMatch = parsedTable.name[j].match(/.hrefparameter\s+=\s+"id=(\d+)";/i);
            if (!idMatch) {
              console.warn('Warn: unable to parse id, using random number', person.name);
              person.id = String(Math.random());
            } else {
              person.id = idMatch[1];
            }

            let phone = parsedTable.phone[j];
            phone = phone.replace(/\D/g, '');


            // Maybe add support for guesing area code if it is ommitted and most of the other ones have the same area code
            if (phone.length === 10) {
              person.phone = phone;
            }

            // Scrape the email from the table
            const email = parsedTable.email[j];
            if (email && email !== 'Not Available') {
              person.email = parsedTable.email[j];

              if (person.email.endsWith('@neu.edu')) {
                person.email = `${person.email.split('@')[0]}@northeastern.edu`;
              }
            }

            // Scrape the primaryappointment
            const primaryappointment = parsedTable.primaryappointment[j];
            if (primaryappointment && primaryappointment !== 'Not Available') {
              person.primaryappointment = he.decode(parsedTable.primaryappointment[j]);
            }

            // Scrape the primarydepartment
            person.primarydepartment = he.decode(parsedTable.primarydepartment[j]);

            // Add it to the index and the people list
            people.push(person);
            if (peopleMap[person.id]) {
              console.log('Error, person already in the people map?', person.id);
            }
            peopleMap[person.id] = person;
          }
          return resolve();
        }
      }

      console.error('YOOOOO it didnt find the table', response.body.length);
      console.error(response.body);
      return reject('nope');
    });
  });
}


async function get(lastNameStart) {

    const jsessionCookie = await getCookiePromise();
    
    utils.verbose('neu employee got cookie', jsessionCookie);

    const response = await hitWithLetters(lastNameStart, jsessionCookie);
    
    return parseLettersResponse(response)
}

async function main() {
  const outputFile = path.join(macros.DEV_DATA_DIR, 'employees.json');

  // if this is dev and this data is already scraped, just return the data
  if (macros.DEV && require.main !== module) {
    const devData = await utils.loadDevData(outputFile);
    if (devData) {
      return devData;
    }
  }


  const promises = [];

  const alphabetArray = macros.ALPHABET.split('')
  
  for (const firstLetter of alphabetArray) {
    for (const secondLetter of alphabetArray) {
      // promises.push()
      await get(firstLetter + secondLetter);
    } 
  }
  // utils.verbose('Done all employee requests')

  await Promise.all(promises);	
  
  utils.verbose('Done all employee requests')
    

  if (macros.DEV) {
    await utils.saveDevData(outputFile, people);
    console.log('employees file saved!');
  }
  
  return people;
}

exports.go = main;

if (require.main === module) {
  main();
}
