import database from '../database';

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


it('should split a key', () => {
  expect(database.standardizeKey('/one/two/three')).toEqual(['one', 'two', 'three']);
  expect(database.standardizeKey('one/two/three')).toEqual(['one', 'two', 'three']);
  expect(database.standardizeKey('one/two/three/')).toEqual(['one', 'two', 'three']);
  expect(database.standardizeKey('/one/two/three/')).toEqual(['one', 'two', 'three']);
});


it('set and get work', async (done) => {
  expect(await database.get('setKey')).toBe(null);

  await database.set('setKey', 'setValue');
  const out = await database.get('setKey');

  expect(out).toBe('setValue');

  done();
});

it('creating an array and fetching it works', async (done) => {
  await database.set('setArray/1', '1');
  await database.set('setArray/2', '2');
  await database.set('setArray/3', '3');
  await database.set('setArray/4', '4');
  await database.set('setArray/5', '5');

  const out = await database.get('setArray');

  expect(out).toEqual(['1', '2', '3', '4', '5']);

  done();
});


it('should test MockFirebaseRef', async (done) => {
  const ref = await database.getRef('setMockRef/1');

  expect(ref.once()).toBe(null);
  expect(ref.once('value')).toBe(null);
  ref.set('setMockRefValue');
  expect(ref.once('value')).toBe('setMockRefValue');
  done();
});
