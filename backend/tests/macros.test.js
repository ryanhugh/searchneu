/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import macros from '../macros';

it('standardize email works', () => {
  const input = macros.standardizeEmail('mailto:b@google.com');
  expect(input).toEqual('b@google.com');
  expect(macros.standardizeEmail('fdafdsa')).toEqual(null);
  expect(macros.standardizeEmail('f@b.com')).toEqual('f@b.com');
});


it('standardizePhone works', () => {
  const input = macros.standardizePhone('tel:5612547896');
  expect(input).toEqual('5612547896');

  const input2 = macros.standardizePhone('tel:+15612547896');
  expect(input2).toEqual('5612547896');

  const input3 = macros.standardizePhone('+15612547896');
  expect(input3).toEqual('5612547896');

  expect(macros.standardizePhone('fdafdsa')).toEqual(null);
});


it('parseGoogleScolarLink works', () => {
  const url = 'https://scholar.google.com/citations?user=aaaaaaa&hl=en&oi=ao';
  const input = macros.parseGoogleScolarLink(url);
  expect(input).toEqual('aaaaaaa');

  const url2 = 'https://scholar.google.com/oi=ao';
  const input2 = macros.parseGoogleScolarLink(url2);
  expect(input2).toEqual(null);
});


it('alphabet is 26', () => {
  expect(macros.ALPHABET.length).toBe(26);
});


it('should parse a name with spaces', () => {
  expect(macros.parseNameWithSpaces('Bob    Ross')).toEqual({
    firstName: 'Bob',
    lastName: 'Ross',
  });

  expect(macros.parseNameWithSpaces('   John    Ross    ')).toEqual({
    firstName: 'John',
    lastName: 'Ross',
  });
});

it('should parse some error', () => {
  expect(macros.parseNameWithSpaces('A B C')).toEqual({
    firstName: 'A',
    lastName: 'C',
  });
});


it('it should parse a single letter', () => {
  expect(macros.parseNameWithSpaces('E')).toEqual(null);
});


it('getBaseHost should work', () => {
  expect(macros.getBaseHost('http://a.google.com')).toBe('google.com');
  expect(macros.getBaseHost('fadjsl.google.com')).toBe(null);
  expect(macros.getBaseHost('fdasfsdcom')).toBe(null);
});

it('occurrences should work', () => {
  expect(macros.occurrences('a a a a b b b b', 'a', false)).toBe(4);
  expect(macros.occurrences('a a a a b b b b', 'aaa', false)).toBe(0);
  expect(macros.occurrences('onenenenenenenene bbbb', 'nenen', true)).toBe(6);
});

it('logAmplitudeEvent should not crash', () => {
  macros.logAmplitudeEvent('event_from_testing', {
    a: 3,
  });
});
