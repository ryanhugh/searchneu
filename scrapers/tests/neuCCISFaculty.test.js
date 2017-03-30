import fs from 'fs-promise'

import neuCCISFaculty from '../neuCCISFaculty';


it('should parse all people', async function(done) {
	var data = await fs.readFile('scrapers/tests/data/neuCCISFaculty/view_all_people.json')
	var resp = JSON.parse(data)
	let output = neuCCISFaculty.parsePeopleList(resp)

	expect(output).toMatchSnapshot()
	done()
});
 

it('parseDetailpage', async function(done) {
	var data = await fs.readFile('scrapers/tests/data/neuCCISFaculty/person.json')
	var resp = JSON.parse(data)

	let output = neuCCISFaculty.parseDetailpage(resp)

	expect(output).toMatchSnapshot()  
	done()
});
 