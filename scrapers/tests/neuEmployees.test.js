import neuEmployees from '../neuEmployees';


it('findName should work', () => {
  const output = neuEmployees.findName(['a', 'b', 'sr', 'bob']);
  expect(output).toBe('bob');
});
