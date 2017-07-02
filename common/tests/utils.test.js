import utils from '../utils';

it('stripMiddleName should work', function() {
  
  expect(utils.stripMiddleName('Benjamin D Lerner')).toEqual('Benjamin Lerner')
  expect(utils.stripMiddleName('Benjamin Djdkasjfldskj Lerner')).toEqual('Benjamin Lerner')
  expect(utils.stripMiddleName('Benjamin #$%^&*() Lerner')).toEqual('Benjamin Lerner')
  expect(utils.stripMiddleName('Benjamin Lerner')).toEqual('Benjamin Lerner')
  expect(utils.stripMiddleName('Benjamin    Lerner')).toEqual('Benjamin Lerner')
  expect(utils.stripMiddleName('Lerner')).toEqual('Lerner')

  expect(utils.stripMiddleName('Benjamin D. Lerner', true)).toEqual('Benjamin Lerner')
  expect(utils.stripMiddleName('Benjamin den Lerner', true)).toEqual('Benjamin den Lerner')


  expect(utils.stripMiddleName('Benjamin den Lerner', true, 'JDFLSKJ', 'jfldsajfl')).toEqual('Benjamin den Lerner')



  expect(utils.stripMiddleName('Benjamin (den) Lerner', true, 'Benjamin', 'Lerner')).toEqual('Benjamin (den) Lerner')

  // Should be kept (for now) because all the characters between last and first name are more than one letter. 
  expect(utils.stripMiddleName('Edwin A. Marengo Fuentes', true)).toEqual('Edwin A. Marengo Fuentes')
});

