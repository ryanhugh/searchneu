import $ from 'cheerio';
import _ from 'lodash';
import macros from '../../../macros';

function validCell(el) {
  return el.type === 'tag' && ['th', 'td'].includes(el.name);
}

/**
 * Parse a table using it's head (or first row) as keys
 * @param {Cheerio} table Cheerio object of table
 * @returns A list of {key: value} where key comes from header
 */
function parseTable(table) {
  if (table[0].name !== 'table') {
    macros.error('parse table was not given a table..');
    return null;
  }

  //includes both header rows and body rows
  const rows = $('tr', table).get();
  if (rows.length === 0) {
    macros.error('zero rows???');
    return null;
  }

  //the headers
  const heads = rows[0].children
    .filter(validCell)
    .map((element) => {
      return $(element).text().trim().toLowerCase()
        .replace(/\s/gi, '');
    });

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
