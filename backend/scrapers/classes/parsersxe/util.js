import $ from 'cheerio';
import _ from 'lodash';
import Request from '../../request';
import macros from '../../../macros';

const request = new Request('util');

function validCell(el) {
  return el.type === 'tag' && ['th', 'td'].includes(el.name);
}

/**
 * Modify a string to avoid collisions with set
 * @param {[String]} set array to avoid collisions with
 * @param {String} value String to uniquify
 * appends a number to end of the string such that it doesn't collide
 */
function uniquify(set, value) {
  if (set.includes(value)) {
    let append = 1;
    while (set.includes(value + append)) {
      append++;
    }
    return value + append;
  }
  return value;
}

/**
 * Parse a table using it's head (or first row) as keys
 * @param {Cheerio} table Cheerio object of table
 * @returns A list of {key: value} where key comes from header
 */
function parseTable(table) {
  if (table.length !== 1 || table[0].name !== 'table') {
    return [];
  }

  //includes both header rows and body rows
  const rows = $('tr', table).get();
  if (rows.length === 0) {
    macros.error('zero rows???');
    return [];
  }

  //the headers
  const heads = rows[0].children
    .filter(validCell)
    .reduce((acc, element) => {
      const head = $(element).text().trim().toLowerCase()
        .replace(/\s/gi, '');
      const uniqueHead = uniquify(acc, head);
      acc.push(uniqueHead);
      return acc;
    }, []);

  //add the other rows
  const ret = [];

  rows.slice(1).forEach((row) => {
    const values = row.children
      .filter(validCell)
      .map((el) => { return $(el).text(); });
    if (values.length >= heads.length) {
      // TODO look into which classes trigger this
      // macros.log('warning, table row is longer than head, ignoring some content');
    }

    ret.push(_.zipObject(heads, values));
  });
  return ret;
}

async function getCookiesForSearch(termCode) {
  // first, get the cookies
  // https://jennydaman.gitlab.io/nubanned/dark.html#studentregistrationssb-clickcontinue-post
  const clickContinue = await request.post({
    url: 'https://nubanner.neu.edu/StudentRegistrationSsb/ssb/term/search?mode=search',
    form: {
      term: termCode,
    },
    cache: false,
  });

  if (clickContinue.body.regAllowed === false) {
    macros.error(`failed to get cookies (from clickContinue) for the term ${termCode}`, clickContinue);
  }

  const cookiejar = request.jar();
  for (const cookie of clickContinue.headers['set-cookie']) {
    cookiejar.setCookie(cookie, 'https://nubanner.neu.edu/StudentRegistrationSsb/');
  }
  return cookiejar;
}

export default {
  parseTable: parseTable,
  getCookiesForSearch: getCookiesForSearch,
};
