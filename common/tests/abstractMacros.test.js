import macros from '../abstractMacros';

it('stripMiddleName should work', () => {
  expect(macros.stripMiddleName('Benjamin D Lerner')).toEqual('Benjamin Lerner');
  expect(macros.stripMiddleName('Benjamin Djdkasjfldskj Lerner')).toEqual('Benjamin Lerner');
  expect(macros.stripMiddleName('Benjamin #$%^&*() Lerner')).toEqual('Benjamin Lerner');
  expect(macros.stripMiddleName('Benjamin Lerner')).toEqual('Benjamin Lerner');
  expect(macros.stripMiddleName('Benjamin    Lerner')).toEqual('Benjamin Lerner');
  expect(macros.stripMiddleName('Lerner')).toEqual('Lerner');

  expect(macros.stripMiddleName('Benjamin D. Lerner', true)).toEqual('Benjamin Lerner');
  expect(macros.stripMiddleName('Benjamin den Lerner', true)).toEqual('Benjamin den Lerner');


  expect(macros.stripMiddleName('Benjamin den Lerner', true, 'JDFLSKJ', 'jfldsajfl')).toEqual('Benjamin den Lerner');


  expect(macros.stripMiddleName('Benjamin (den) Lerner', true, 'Benjamin', 'Lerner')).toEqual('Benjamin (den) Lerner');

  // Should be kept (for now) because all the characters between last and first name are more than one letter.
  expect(macros.stripMiddleName('Edwin A. Marengo Fuentes', true)).toEqual('Edwin Marengo Fuentes');
});

it('replaceAll should work', () => {
  expect(macros.replaceAll('hi there', 'hi', 'hello')).toBe('hello there');
});

it('isNumeric should work', () => {
  expect(macros.isNumeric('fjdaslkfjlas')).toBe(false);
  expect(macros.isNumeric('3')).toBe(true);
  expect(macros.isNumeric(NaN)).toBe(false);
});
