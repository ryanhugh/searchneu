import fs from 'fs-promise';

import neuClubs from '../neuClubs';


it('should parse all people', async (done) => {
  const data = await fs.readFile('scrapers/tests/data/neuCCISFaculty/view_all_people.json');
  const resp = JSON.parse(data);
  const output = neuCCISFaculty.parsePeopleList(resp);

  expect(output).toMatchSnapshot();
  done();
});


it('parseDetailpage', async (done) => {
  const data = await fs.readFile('scrapers/tests/data/neuCCISFaculty/person.json');
  const resp = JSON.parse(data);

  const output = neuCCISFaculty.parseDetailpage(resp);

  expect(output).toMatchSnapshot();
  done();
});

