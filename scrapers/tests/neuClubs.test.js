import fs from 'fs-promise';

import neuClubs from '../neuClubs';

fit('parseDetails should work', async (done) => {
  const data = await fs.readFile('scrapers/tests/data/neuClubs/club.json');
  const resp = JSON.parse(data);
  const output = neuClubs.parseDetails(resp.body);

  expect(output).toMatchSnapshot();
  done();
});

fit('parseLetterAndPage should work', async (done) => {
  const data = await fs.readFile('scrapers/tests/data/neuClubs/letter.json');
  const resp = JSON.parse(data);
  const output = neuClubs.parseLetterAndPage(resp);

  expect(output).toMatchSnapshot();
  done();
});

