import fs from 'fs-promise'

import neuCCISFaculty from '../neuCCISFaculty';


it('should parse all people', async function(done) {
	var data = await fs.readFile('scrapers/tests/data/neuCCISFaculty/view_all_people.json')
	var resp = JSON.parse(data)
	let output = neuCCISFaculty.parsePeopleList(resp)

	expect(output.length).toBe(339)
	expect(output[0].name).toBe('Muzammil Abdul Rehman')
	expect(output[0].link).toBe('http://www.ccis.northeastern.edu/people/muzammil-abdul-rehman/')
	expect(output[0].positions[0]).toBe('PhD Student')
	expect(output[0].positions.length).toBe(1)
	expect(output[0].email).toBe('muzammil@ccs.neu.edu')
	done()
});
 