/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import htmlparser from 'htmlparser2';
import domutils from 'domutils';
import _ from 'lodash';
import cookie from 'cookie';
import he from 'he';

import Request from '../request';
import cache from '../cache';
import macros from '../../macros';

const request = new Request('Employees');

// Scrapes from here: https://prod-web.neu.edu/wasapp/employeelookup/public/main.action

// TODO:
// Some of the phone numbers are not 10 digits. Might be able to guess area code, but it is not allways 215 just because some people have offices outside of Boston.
// Phone numbers that are not 10 digits are ignored right now.
// The detail page also has a name without the comma, but don't see a reason on scraping that instead of just splitting on comma and moving.
// Is that name ever different than the one with the comma?
// Their office is also in that detail page, but it seems like if is often different than the ones the professors have
// on their CCIS/COE/CSSH profile. Unsure if it would be worth scraping that too.


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

class Employee {
  constructor() {
    this.people = [];

    this.couldNotFindNameList = {};


    this.cookiePromise = null;
  }

  handleRequestResponce(body, callback) {
    const handler = new htmlparser.DomHandler(callback);
    const parser = new htmlparser.Parser(handler);
    parser.write(body);
    parser.done();
  }


  //returns a {colName:[values]} where colname is the first in the column
  //regardless if its part of the header or the first row of the body
  parseTable(table) {
    if (table.name !== 'table') {
      macros.error('parse table was not given a table..');
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
          macros.log('warning, table row is longer than head, ignoring content', index, heads, rows);
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


  async getCookiePromise() {
    if (this.cookiePromise) {
      return this.cookiePromise;
    }

    macros.verbose('neu employee getting cookie');

    this.cookiePromise = request.get({
      url: 'https://prod-web.neu.edu/wasapp/employeelookup/public/main.action',
    }).then((resp) => {
      // Parse the cookie from the response
      const cookieString = resp.headers['set-cookie'][0];
      const cookies = cookie.parse(cookieString);
      macros.verbose('Got cookie.');
      return cookies.JSESSIONID;
    });

    return this.cookiePromise;
  }


  hitWithLetters(lastNameStart, jsessionCookie) {
    return request.get({
      url: `https://prod-web.neu.edu/wasapp/employeelookup/public/searchEmployees.action?searchBy=Last+Name&queryType=begins+with&searchText=${lastNameStart}&deptText=&addrText=&numText=&divText=&facStaff=1`,
      headers: {
        Cookie: `JSESSIONID=${jsessionCookie}`,
      },
    });
  }


  // Given a list of things, will find the first one that is longer than 1 letter (a-z)
  findName(list) {
    for (let i = 0; i < list.length; i++) {
      const noSymbols = list[i].toLowerCase().replace(/[^0-9a-zA-Z]/gi, '');

      if (noSymbols.length > 1 && !['ii', 'iii', 'jr', 'sr', 'dr'].includes(noSymbols)) {
        return list[i];
      }
    }


    // Only log each warning once, just to not spam the macros. This method is called a lot.
    const logMatchString = list.join('');
    if (this.couldNotFindNameList[logMatchString]) {
      return null;
    }
    this.couldNotFindNameList[logMatchString] = true;

    macros.log('Could not find name from list:', list);
    return null;
  }


  // This splits the employee name by the comma in the middle and the name after the comma is the first name and the name before is the last name
  // The util function for this does not split the name by the comma, it assumes that the name is just separated by spaces.
  getFirstLastName(name) {
    if (name.match(/jr.?,/gi)) {
      name = name.replace(/, jr.?,/gi, ',');
    }

    name = _.trim(name, ',');

    if (macros.occurrences(name, ',') !== 1) {
      macros.log('Name has != 1 commas', name);
      return null;
    }

    const splitOnComma = name.split(',');

    const beforeCommaSplit = splitOnComma[1].trim().split(' ');
    const firstName = this.findName(beforeCommaSplit);

    const afterCommaSplit = splitOnComma[0].trim().split(' ').reverse();
    const lastName = this.findName(afterCommaSplit);

    const retVal = {};
    retVal.firstName = firstName;
    retVal.lastName = lastName;
    return retVal;
  }


  parseLettersResponse(response, lastNameStart) {
    return new Promise((resolve, reject) => {
      this.handleRequestResponce(response.body, (err, dom) => {
        const elements = domutils.getElementsByTagName('table', dom);

        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];

          const goal = {
            width: '100%',
          };

          if (_.isEqual(element.attribs, goal)) {
            // Delete one of the elements that is before the header that would mess stuff up
            domutils.removeElement(element.children[1].children[1]);

            const tableData = this.parseTable(element);


            if (!tableData) {
              return resolve();
            }

            const parsedTable = tableData.parsedTable;
            const rowCount = tableData.rowCount;

            macros.log('Found', rowCount, ' people on page ', lastNameStart);

            for (let j = 0; j < rowCount; j++) {
              const person = {};
              const nameWithComma = he.decode(parsedTable.name[j]).split('\n\n')[0];

              if (nameWithComma.includes('Do Not Use ')) {
                macros.log('Skipping entry that says Do Not Use.');
                continue;
              }


              // Put the first name before the last name.
              // Another way to do this would be to hit the detail section of each employee and scrape the name from the title.
              const commaNameSplit = nameWithComma.split(',');

              for (let k = 0; k < commaNameSplit.length; k++) {
                commaNameSplit[k] = commaNameSplit[k].trim();
              }


              // Remove Jr and Jr.
              _.pull(commaNameSplit, 'Jr', 'Jr.');


              if (commaNameSplit.length > 2) {
                macros.warn('Has more than one comma skipping.', commaNameSplit);
                person.name = nameWithComma;
              } else {
                person.name = `${commaNameSplit[1].trim()} ${commaNameSplit[0].trim()}`;
              }


              // Generate first name and last name from the name on the person
              const firstLastName = this.getFirstLastName(nameWithComma);
              if (!firstLastName) {
                continue;
              }
              const { firstName, lastName } = firstLastName;
              if (firstName && lastName) {
                person.firstName = firstName;
                person.lastName = lastName;
              }


              const idMatch = parsedTable.name[j].match(/.hrefparameter\s+=\s+"id=(\d+)";/i);
              if (!idMatch) {
                macros.warn('Unable to parse id, using random number', nameWithComma);
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
              const email = macros.standardizeEmail(parsedTable.email[j]);
              if (email) {
                person.emails = [email];
              }

              // Scrape the primaryappointment
              const primaryappointment = parsedTable.primaryappointment[j];
              if (primaryappointment && primaryappointment !== 'Not Available') {
                person.primaryRole = he.decode(parsedTable.primaryappointment[j]);
              }

              // Scrape the primary department
              person.primaryDepartment = he.decode(parsedTable.primarydepartment[j]);

              // Add it to the people list
              this.people.push(person);
            }
            return resolve();
          }
        }

        macros.error('YOOOOO it didnt find the table', response.body.length);
        macros.error(response.body);
        return reject();
      });
    });
  }


  async get(lastNameStart) {
    const jsessionCookie = await this.getCookiePromise();

    macros.verbose('neu employee got cookie', jsessionCookie);

    const response = await this.hitWithLetters(lastNameStart, jsessionCookie);

    return this.parseLettersResponse(response, lastNameStart);
  }

  async main() {
    // if this is dev and this data is already scraped, just return the data
    if (macros.DEV && require.main !== module) {
      const devData = await cache.get(macros.DEV_DATA_DIR, this.constructor.name, 'main');
      if (devData) {
        return devData;
      }
    }


    const promises = [];

    const alphabetArray = macros.ALPHABET.split('');

    for (const firstLetter of alphabetArray) {
      for (const secondLetter of alphabetArray) {
        promises.push(this.get(firstLetter + secondLetter));
      }
    }

    await Promise.all(promises);

    macros.verbose('Done all employee requests');


    if (macros.DEV) {
      await cache.set(macros.DEV_DATA_DIR, this.constructor.name, 'main', this.people);
      macros.log(this.people.length, 'employees saved to a file!');
    }

    return this.people;
  }
}


const instance = new Employee();

export default instance;


if (require.main === module) {
  instance.main();
}
