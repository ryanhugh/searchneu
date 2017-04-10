import fs from 'fs-promise'

import neuClubs from '../neuClubs';

fit('parseDetails should work', async function(done) {
	var data = await fs.readFile('scrapers/tests/data/neuClubs/club.json')
	var resp = JSON.parse(data)
	let output = neuClubs.parseDetails(resp.body)

	expect(output).toMatchSnapshot()
	done()
});
 
fit('parseLetterAndPage should work', async function(done) {
	var data = await fs.readFile('scrapers/tests/data/neuClubs/letter.json')
	var resp = JSON.parse(data)
	let output = neuClubs.parseLetterAndPage(resp)

	expect(output).toMatchSnapshot()
	done()
});
 
