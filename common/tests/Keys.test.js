/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import Keys from '../Keys';

it('should be able to make a hash for hosts', () => {
  // All hosts
  let obj = {};

  // TODO: fix
  // expect(Keys.getHostHash(obj)).toBe('');

  // just 1 host
  obj = { host:'neu.edu' };

  expect(Keys.getHostHash(obj)).toBe('neu.edu');
});


it('should be able to make a hash for terms', () => {
  // All hosts
  const obj = { host:'neuuuuu', termId: '201920' };

  expect(Keys.getTermHash(obj)).toBe('neuuuuu/201920');
});

it('should be able to make a hash for subject', () => {
  // All hosts
  const obj = { host:'neuuuuu', termId: '201920', subject: 'CS' };

  expect(Keys.getSubjectHash(obj)).toBe('neuuuuu/201920/CS');
});

it('should be able to make a hash for class', () => {
  // All hosts
  const obj = {
    host:'neuuuuu', termId: '201920', subject: 'CS', classId: '25000000',
  };

  expect(Keys.getClassHash(obj)).toBe('neuuuuu/201920/CS/25000000');
});


it('should be able to make a hash for section', () => {
  // All hosts
  const obj = {
    host:'neuuuuu', termId: '201920', subject: 'CS', classId: '25000000', crn: '12345',
  };

  expect(Keys.getSectionHash(obj)).toBe('neuuuuu/201920/CS/25000000/12345');
});


it('should be able to replace some odd stuff', () => {
  // All hosts
  const obj = {
    host:'neuuuuu', termId: '201920', subject: 'CS', classId: '25000000', crn: '12__fdly83473iw7hd$#%^&*( 345',
  };

  expect(Keys.getSectionHash(obj)).toBe('neuuuuu/201920/CS/25000000/12__fdly83473iw7hd________345');
});
