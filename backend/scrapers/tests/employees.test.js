import employees from '../employees';


it('findName should work', () => {
  const output = employees.findName(['a', 'b', 'sr', 'bob']);
  expect(output).toBe('bob');
});
