const request = require('request');
const htmlparser = require('htmlparser2');
const domutils = require('domutils');
const _ = require('lodash');
const elasticlunr = require('elasticlunr');
const fs = require('fs-promise');
const async = require('async');
const cookie = require('cookie');
const retry = require('promise-retry');
import mkdirp from 'mkdirp-promise';
import path from 'path';

const alphabet = 'aqwertyuiopsdfghjklzxcvbnm';

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

const index = elasticlunr();
index.saveDocument(false);

index.setRef('id');
index.addField('name');
index.addField('phone');
index.addField('email');
index.addField('primaryappointment');
index.addField('primarydepartment');


const getCookie = async.memoize((callback) => {
  request({
    url: 'https://prod-web.neu.edu/wasapp/employeelookup/public/main.action',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143',
    },
  }, (err, resp) => {
    if (err) {
      callback(err);
      return;
    }

    const cookieString = resp.headers['set-cookie'][0];
    const cookies = cookie.parse(cookieString);
    callback(null, cookies.JSESSIONID);
  });
});


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
  return new Promise((resolve, reject) => {
    getCookie(async (err, jsessionCookie) => {
      if (err) {
        reject(err);
        return;
      }

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
              } else {
                person.id = idMatch[1];
              }

              let phone = parsedTable.phone[j];
              phone = phone.replace(/\D/g, '');


              // Maybe add support for guesing area code if it is ommitted and most of the other ones have the same area code
              if (phone.length === 10) {
                person.phone = phone;
              }

              person.email = parsedTable.email[j];
              person.primaryappointment = parsedTable.primaryappointment[j];
              person.primarydepartment = parsedTable.primarydepartment[j];
              people.push(person);
              index.addDoc(person);
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
  });
}

async function main() {
  const promises = [];

  alphabet.split('').forEach((firstLetter) => {
    alphabet.split('').forEach((secondLetter) => {
      promises.push(get(firstLetter + secondLetter));
    });
  });


  await Promise.all(promises);

  const rootFolder = path.join('..', 'compiled_frontend', 'getEmployees', 'neu.edu');

  await mkdirp(rootFolder);

  await fs.writeFile(path.join(rootFolder, 'data.json'), JSON.stringify(people));


  await fs.writeFile(path.join(rootFolder, 'searchIndex.json'), JSON.stringify(index.toJSON()));


  await fs.writeFile(path.join(rootFolder, 'map.json'), JSON.stringify(peopleMap));

  console.log('All 3 files saved!');
}

exports.go = main;

if (require.main === module) {
  main();
}

// getCookie(function (err, cookie) {
//  console.log(err, cookie);
// }.bind(this))
