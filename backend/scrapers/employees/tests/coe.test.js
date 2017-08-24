import fs from 'fs-promise';
import path from 'path';

import coe from '../coe';


it('should parse a', async (done) => {
  

  const body = await fs.readFile(path.join(__dirname, 'data', 'coe', 'letter a.html'));

  let retVal = coe.scrapeLetter(body)
  expect(retVal).toMatchSnapshot();
  done()

});

it('should parse q', async (done) => {
  

  const body = await fs.readFile(path.join(__dirname, 'data', 'coe', 'letter q.html'));

  let retVal = coe.scrapeLetter(body)
  expect(retVal.length).toEqual(0);
  done()

});

it('should parse q', async (done) => {
  

  const body = await fs.readFile(path.join(__dirname, 'data', 'coe', 'detail page.html'));

  let retVal = coe.scrapeDetailpage(body)
  expect(retVal).toMatchSnapshot();
  done()

});
