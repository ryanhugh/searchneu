import utils from '../utils';
import macros from '../macros';

it('standardize email works', () => {
  const input = utils.standardizeEmail('mailto:b@google.com');
  expect(input).toEqual('b@google.com');
  expect(utils.standardizeEmail('fdafdsa')).toEqual(null);
  expect(utils.standardizeEmail('f@b.com')).toEqual('f@b.com');
});


it('standardizePhone works', () => {

  const input = utils.standardizePhone('tel:5612547896');
  expect(input).toEqual('5612547896');

  const input2 = utils.standardizePhone('tel:+15612547896');
  expect(input2).toEqual('5612547896');

  const input3 = utils.standardizePhone('+15612547896');
  expect(input3).toEqual('5612547896');

  expect(utils.standardizePhone('fdafdsa')).toEqual(null);
});


it('parseGoogleScolarLink works', () => {
  const url = 'https://scholar.google.com/citations?user=aaaaaaa&hl=en&oi=ao';
  const input = utils.parseGoogleScolarLink(url);
  expect(input).toEqual('aaaaaaa');

  const url2 = 'https://scholar.google.com/oi=ao';
  const input2 = utils.parseGoogleScolarLink(url2);
  expect(input2).toEqual(null);
});


it('alphabet is 26', () => {
  expect(macros.ALPHABET.length).toBe(26);
});
