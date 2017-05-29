import fs from 'fs-promise';

import ccis from '../ccis';


it('should parse all people', async (done) => {
  const data = await fs.readFile('scrapers/tests/data/ccis/view_all_people.json');
  const resp = JSON.parse(data);
  const output = ccis.parsePeopleList(resp);

  expect(output).toMatchSnapshot();
  done();
});


it('parseDetailpage', async (done) => {
  const data = await fs.readFile('scrapers/tests/data/ccis/person.json');
  const resp = JSON.parse(data);

  const output = ccis.parseDetailpage(resp);

  expect(output).toMatchSnapshot();
  done();
});

