import $ from 'cheerio';
import _ from 'lodash';
import macros from '../../../macros';

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
    macros.error('parse table was not given a table..');
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
    if (row.children.length >= heads.length) {
      macros.log('warning, table row is longer than head, ignoring some content', heads, row);
    }
    const values = row.children
      .filter(validCell)
      .map((el) => { return $(el).text(); });

    ret.push(_.zipObject(heads, values));
  });
  return ret;
}

export default {
  parseTable: parseTable,
};
