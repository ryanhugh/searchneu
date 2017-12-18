import database from '../database';
import macros from '../macros';

// Note when testing here: The database is not reset between tests.

it('set and get should work', () => {
  const keyPath = ['aaa', 'bbb'];

  database.setMemoryStorage(keyPath, 5);

  const output = database.getMemoryStorage(keyPath);

  expect(output).toBe(5);
});


it('get should return null when there is no value', () => {
  const keyPath = ['shouldbeempty'];

  const output = database.getMemoryStorage(keyPath);

  expect(output).toBe(null);
});

it('should also be empty when', () => {
  const keyPath = ['shouldbeempty', 'empty', 'also empty'];

  const output = database.getMemoryStorage(keyPath);

  expect(output).toBe(null);
});


it('should return an array when there are multiple values', () => {
  database.setMemoryStorage(['aaa1', 'bbb'], 1);
  database.setMemoryStorage(['aaa1', '22'], 2);
  database.setMemoryStorage(['aaa1', '33'], 3);
  database.setMemoryStorage(['aaa1', '44'], 4);

  const output = database.getMemoryStorage(['aaa1']);

  output.sort();

  expect(output).toEqual([1, 2, 3, 4]);
});


it('can override a leaf node with a path', () => {
  database.setMemoryStorage(['overridetest'], 1);

  let output = database.getMemoryStorage(['overridetest']);
  expect(output).toBe(1);

  database.setMemoryStorage(['overridetest', 'another path'], 1);

  database.setMemoryStorage(['overridetest', 'path 2'], 2);

  output = database.getMemoryStorage(['overridetest']);

  output.sort();

  expect(output).toEqual([1, 2]);
});


it('should split a key', function() {
  expect(database.standardizeKey('/one/two/three')).toEqual(['one','two','three'])
  expect(database.standardizeKey('one/two/three')).toEqual(['one','two','three'])
  expect(database.standardizeKey('one/two/three/')).toEqual(['one','two','three'])
  expect(database.standardizeKey('/one/two/three/')).toEqual(['one','two','three'])

});