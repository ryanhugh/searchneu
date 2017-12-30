/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import DataLib from '../DataLib';

import mockTermDump from './mockTermDump.json';

it('should be able to create an instance', () => {
  const dataLib = DataLib.loadData({
    201752: mockTermDump,
  });

  expect(dataLib).not.toBe(null);
});

it('should not create an instance when given bad arguments', () => {
  const dataLib = DataLib.loadData({
    201752: { hi: 5 },
  });

  expect(dataLib).toBe(null);
});


it('shold return the classes in a subject', () => {
  const dataLib = DataLib.loadData({
    201752: mockTermDump,
  });

  const classes = dataLib.getClassesInSubject('WS', '201752');

  expect(classes).toEqual([
    'neu.edu/201752/LS/6211',
    'neu.edu/201752/LS/6212',
    'neu.edu/201752/LS/6230',
    'neu.edu/201752/LS/6300',
  ]);
});


it('should be able to list the subjects', () => {
  const dataLib = DataLib.loadData({
    201752: mockTermDump,
  });

  const output = dataLib.getSubjects('201752');

  expect(output).toEqual([{
    subject: 'LS',
    text: 'Legal Studies',
    termId: '201752',
    host: 'neu.edu',
  },
  {
    subject: 'WS',
    text: 'Woahhhhhh Stan',
    termId: '201752',
    host: 'neu.edu',
  }]);
});
