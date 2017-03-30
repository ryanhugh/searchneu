import combineCCISandEmployees from '../combineCCISandEmployees'

it('findName should work', function() {
	const output=combineCCISandEmployees.findName(['a','b','sr','bob'])
	expect(output).toBe('bob')
});