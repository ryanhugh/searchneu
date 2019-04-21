/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import Keys from '../Keys';


it('should be able to make a hash for hosts', () => {

  // All hosts
  let obj = {}

  expect(Keys.create(obj).getHash()).toBe('');

  // just 1 host
  obj = {host:'neu.edu'}

  expect(Keys.create(obj).getHash()).toBe('neu.edu');  
})


it('should be able to make a hash for terms', () => {

  // All hosts
  let obj = {host:'neuuuuu', termId: '201920'}

  expect(Keys.create(obj).getHash()).toBe('neuuuuu/201920');  
})

it('should be able to make a hash for subject', () => {

  // All hosts
  let obj = {host:'neuuuuu', termId: '201920', subject: 'CS'}

  expect(Keys.create(obj).getHash()).toBe('neuuuuu/201920/CS');  
})

it('should be able to make a hash for class', () => {

  // All hosts
  let obj = {host:'neuuuuu', termId: '201920', subject: 'CS', classId: '25000000'}

  expect(Keys.create(obj).getHash()).toBe('neuuuuu/201920/CS/25000000');  
})


it('should be able to make a hash for section', () => {

  // All hosts
  let obj = {host:'neuuuuu', termId: '201920', subject: 'CS', classId: '25000000', crn: '12345'}

  expect(Keys.create(obj).getHash()).toBe('neuuuuu/201920/CS/25000000/12345');  
})



it('should be able to make a hash for string', () => {

  // All hosts
  let obj = {host:'neuuuuu', desc: 'djflkadsjfladjslfjdsaljfldsa fd fjldsajf lds f$%^&*(F Dsf dlajflks'}

  expect(Keys.create(obj).getHash()).toBe('neuuuuu/201920/CS/25000000/12345');  
})




// it('stripMiddleName should work', () => {
//   expect(macros.stripMiddleName('Benjamin D Lerner')).toEqual('Benjamin Lerner');
//   expect(macros.stripMiddleName('Benjamin Djdkasjfldskj Lerner')).toEqual('Benjamin Lerner');
//   expect(macros.stripMiddleName('Benjamin #$%^&*() Lerner')).toEqual('Benjamin Lerner');
//   expect(macros.stripMiddleName('Benjamin Lerner')).toEqual('Benjamin Lerner');
//   expect(macros.stripMiddleName('Benjamin    Lerner')).toEqual('Benjamin Lerner');
//   expect(macros.stripMiddleName('Lerner')).toEqual('Lerner');

//   expect(macros.stripMiddleName('Benjamin D. Lerner', true)).toEqual('Benjamin Lerner');
//   expect(macros.stripMiddleName('Benjamin den Lerner', true)).toEqual('Benjamin den Lerner');


//   expect(macros.stripMiddleName('Benjamin den Lerner', true, 'JDFLSKJ', 'jfldsajfl')).toEqual('Benjamin den Lerner');


//   expect(macros.stripMiddleName('Benjamin (den) Lerner', true, 'Benjamin', 'Lerner')).toEqual('Benjamin (den) Lerner');

//   // Should be kept (for now) because all the characters between last and first name are more than one letter.
//   expect(macros.stripMiddleName('Edwin A. Marengo Fuentes', true)).toEqual('Edwin Marengo Fuentes');
// });




// it('replaceAll should work', () => {
//   expect(macros.replaceAll('hi there', 'hi', 'hello')).toBe('hello there');
// });

// it('isNumeric should work', () => {
//   expect(macros.isNumeric('fjdaslkfjlas')).toBe(false);
//   expect(macros.isNumeric('3')).toBe(true);
//   expect(macros.isNumeric(NaN)).toBe(false);
// });
