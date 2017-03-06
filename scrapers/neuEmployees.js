import request from 'request';
import htmlparser from 'htmlparser2';
import domutils from 'domutils';
import _ from 'lodash';
import fs from 'fs-promise';
import cookie from 'cookie';
import retry from 'promise-retry';
import mkdirp from 'mkdirp-promise';
import path from 'path';
import he from 'he'

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


  const retVal = {
    _rowCount: rows.length - 1,
  };
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
  return retVal;
}

const people = [];
const peopleMap = {};

let cookiePromise = null;

async function getCookiePromise() {
  if (cookiePromise) {
    return cookiePromise;
  }

  cookiePromise = new Promise((resolve, reject) => {
    request({
      url: 'https://prod-web.neu.edu/wasapp/employeelookup/public/main.action',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143',
      },
    }, (err, resp) => {
      if (err) {
        reject(err);
        return;
      }

      const cookieString = resp.headers['set-cookie'][0];
      const cookies = cookie.parse(cookieString);
      resolve(cookies.JSESSIONID);
    });
  });

  return cookiePromise;
}


function hitWithLetters(lastNameStart, jsessionCookie) {
  return retry({
    factor: 1,
    maxTimeout: 5000,
  }, (retryCount, num) => {
    return new Promise((resolve, reject) => {
      const reqBody = `searchBy=Last+Name&queryType=begins+with&searchText=${lastNameStart}&deptText=&addrText=&numText=&divText=&facStaff=1`;
      request({
        url: 'https://prod-web.neu.edu/wasapp/employeelookup/public/searchEmployees.action',
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143',
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: `JSESSIONID=${jsessionCookie}`,
          Referer: 'https://prod-web.neu.edu/wasapp/employeelookup/public/searchEmployees.action',
        },
        body: reqBody,
      }, (err, resp, body) => {
        if (err) {
          console.log('Failed to get letters', err, num);
          reject(err);
          return;
        }
        resolve(body);
      });
    }).catch(retry);
  });
}


function get(lastNameStart) {
  return new Promise(async(resolve, reject) => {
    const jsessionCookie = await getCookiePromise();

    const body = await hitWithLetters(lastNameStart, jsessionCookie);

    handleRequestResponce(body, (err, dom) => {
      const elements = domutils.getElementsByTagName('table', dom);

      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];

        const goal = {
          width: '100%',
        };

        if (_.isEqual(element.attribs, goal)) {
          // Delete one of the elements that is before the header that would mess stuff up
          domutils.removeElement(element.children[1].children[1]);

          const parsedTable = parseTable(element);
          if (!parsedTable) {
            // console.log('Warning Unable to parse table:', lastNameStart)
            return resolve();
          }
          console.log('Found', parsedTable._rowCount, ' people on page ', lastNameStart);

          for (let j = 0; j < parsedTable._rowCount; j++) {
            const person = {};
            person.name = parsedTable.name[j].split('\n\n')[0];

            const idMatch = parsedTable.name[j].match(/.hrefparameter\s+=\s+"id=(\d+)";/i);
            if (!idMatch) {
              console.warn('Warn: unable to parse id, using random number', person.name);
              person.id = String(Math.random());
            }
            else {
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
              person.primaryappointment = he.decode(parsedTable.primaryappointment[j])
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

      console.log('YOOOOO it didnt find the table');
      console.log(body);

      return reject('nope');
    });
  });
}

async function main() {
  const outputFile = path.join(macros.DEV_DATA_DIR, 'employees.json');

  // if this is dev and this data is already scraped, just return the data
  if (macros.DEV && require.main !== module) {
    const exists = await fs.exists(outputFile);
    if (exists) {
      return require(outputFile);
    }
  }


  const promises = [];

  macros.ALPHABET.split('').forEach((firstLetter) => {
    macros.ALPHABET.split('').forEach((secondLetter) => {
      promises.push(get(firstLetter + secondLetter));
    });
  });


  await Promise.all(promises);

  if (macros.DEV) {
    await mkdirp(macros.DEV_DATA_DIR);

    await fs.writeFile(outputFile, JSON.stringify(people));

    console.log('employees file saved!');
  }

  return people;
}

exports.go = main;

if (require.main === module) {
  main();
}
