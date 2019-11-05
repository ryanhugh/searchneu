import fs from 'fs-extra';
import path from 'path';
import cheerio from 'cheerio';
import util from '../util';

describe('parseTable', () => {
  it('pulls out right data', async () => {
    const body = await fs.readFile(path.join(__dirname, 'data', 'util', '1.html'), 'utf8');

    const rawTable = cheerio.load(body)('table');
    const parsedTable = util.parseTable(rawTable);
    expect(parsedTable).toMatchSnapshot();
  });

  it('ignores columns too wide and blank cells', async () => {
    const body = await fs.readFile(path.join(__dirname, 'data', 'util', '2.html'), 'utf8');

    const rawTable = cheerio.load(body)('table');
    const parsedTable = util.parseTable(rawTable);
    expect(parsedTable).toMatchSnapshot();
  });

  it('uniquifies the head', async () => {
    const body = await fs.readFile(path.join(__dirname, 'data', 'util', '3.html'), 'utf8');

    const rawTable = cheerio.load(body)('table');
    const parsedTable = util.parseTable(rawTable);
    expect(parsedTable).toMatchSnapshot();
  });
});
