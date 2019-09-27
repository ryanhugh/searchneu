/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import fs from 'fs-extra';
import path from 'path';
import cheerio from 'cheerio';
import baseParser from '../baseParser';


it('toTitleCase works', () => {
  expect(baseParser.toTitleCase('TBA')).toBe('TBA');
  expect(baseParser.toTitleCase('Texas A&M University')).toBe('Texas A&M University');
  expect(baseParser.toTitleCase(' Untrimmed ')).toBe('Untrimmed');
});

it('standardizeClassName', () => {
  expect(baseParser.standardizeClassName('2nd Year Japanese')).toBe('2nd Year Japanese');
  expect(baseParser.standardizeClassName('BMC: General Chemistry II')).toBe('BMC: General Chemistry II');

  let goodName = 'Interactive Learning Seminar for Physics 1151';
  expect(baseParser.standardizeClassName('Int. Learn for Phys 1151', [goodName])).toBe(goodName);

  goodName = 'Connections and Decisions';
  expect(baseParser.standardizeClassName('Connections & Decisions', ['hihfdsjal', goodName])).toBe(goodName);

  let classNameTranslation = {

    // math
    'Calculus 3 for Sci/engr (hon)': 'Calculus 3 for Science and Engineering (hon)',
    'Calculus 3 for Sci/engr(hon)': 'Calculus 3 for Science and Engineering (hon)',
    'Calculus 2 for Sci/engr (hon)': 'Calculus 2 for Science and Engineering (hon)',
    'Calculus 1 for Sci/engr (hon)': 'Calculus 1 for Science and Engineering (hon)',
    'Calculus 1for Sci/engr (hon)': 'Calculus 1 for Science and Engineering (hon)',
    'Calc for Business/econ (hon)': 'Calculus for Business and Economics (hon)',
    'Calc & Diff Eq - Biol 1(hon)': 'Calculus and Differential Equations for Biology 1 (hon)',

    // econ
    'Principles of Microecon (hon)': 'Principles of Microeconomics (hon)',

    // cs
    'Fundamental of Com Sci1': 'Fundamentals of Computer Science 1',
    'Fundamentals of Com Sci1 (hon)': 'Fundamentals of Computer Science 1 (hon)',
    'Crisis Resolution in Mdl East': 'Crisis Resolution in Middle East',
  };

  let badName;

  for (badName of Object.keys(classNameTranslation)) {
    goodName = classNameTranslation[badName];
    expect(baseParser.standardizeClassName(badName, ['hihfdsjal', goodName])).toBe(goodName);
  }


  // additional tests just for the new name standardizer
  classNameTranslation = {
    'Foundations of Psych': 'Foundations of Psychology',
    'Arch,infrastructure&city ': 'Architecture, Infrastructure, and the City',
    'Principles of Macroecon    (hon)   ': 'Principles of Macroeconomics (hon)',
  };


  for (badName of Object.keys(classNameTranslation)) {
    goodName = classNameTranslation[badName];
    expect(baseParser.standardizeClassName(badName, ['hihfdsjal', goodName])).toBe(goodName);
  }


  badName = 'Dif Eq & Lin Alg Fr Engr';
  let possibleMatch = 'Differential Equations and Linear Algebra for Engineering (hon)';
  goodName = 'Differential Equations and Linear Algebra for Engineering';
  expect(baseParser.standardizeClassName(badName, ['hihfdsjal', possibleMatch])).toBe(goodName);


  badName = 'General Phys I- Lab';
  possibleMatch = 'General Physics I';
  goodName = 'General Physics I - Lab';
  expect(baseParser.standardizeClassName(badName, ['hihfdsjal', possibleMatch])).toBe(goodName);


  badName = 'Co-op Work Experience--cj';
  possibleMatch = 'Co-op Work Experience-as';
  goodName = 'Co-op Work Experience - cj';
  expect(baseParser.standardizeClassName(badName, ['hihfdsjal', possibleMatch])).toBe(goodName);

  expect(baseParser.standardizeClassName('hi    (yo)')).toBe('hi (yo)');

  expect(baseParser.standardizeClassName('hi (HON)')).toBe('hi (hon)');


  const name = 'St: Wireless Sensor Networks';
  expect(baseParser.standardizeClassName(name, ['St: Intro. to Multiferroics'])).toBe(name);

  expect(baseParser.standardizeClassName('Directed Reading', ['Dir Rdg:'])).toBe('Directed Reading');

  // Should pick the first one when name length === 0
  expect(baseParser.standardizeClassName('', ['hihfdsjal', 'soemthing else'])).toBe('hihfdsjal');
});


it('parseTable', async (done) => {
  const body = await fs.readFile(path.join(__dirname, 'data', 'baseParser', '1.html'), 'utf8');

  const $ = cheerio.load(body);

  // Get the root dom node.
  // Cheerio adds a "root" node on top of everything, so the element we are looking for is the root nodes first child.
  // In this case it is a table.
  const rootNode = $.root().children()[0];

  // I switched it to .rowCount and .tableData so this dosen't work yet
  const tableDataAndRowCount = baseParser.parseTable(rootNode);

  expect(tableDataAndRowCount).toMatchSnapshot();

  done();
});


it('parseTable should work 2', async (done) => {
  const body = await fs.readFile(path.join(__dirname, 'data', 'baseParser', '3.html'), 'utf8');

  const fileJSON = JSON.parse(body);

  const $ = cheerio.load(fileJSON.body);

  // Get the root dom node.
  // Cheerio adds a "root" node on top of everything, so the element we are looking for is the root nodes first child.
  // In this case it is a table.
  const rootNode = $.root().children()[0];

  // I switched it to .rowCount and .tableData so this dosen't work yet
  expect(baseParser.parseTable(rootNode)).toMatchSnapshot();

  done();
});


const text = '\n'
+ '    1.000 TO     2.000 Credit hours\n'
+ '\n'
+ '\n'
+ 'Levels: Undergraduate Transcript\n'
+ '\n'
+ 'Schedule Types: Research Project\n'
+ '\n'
+ '\n'
+ 'Non-Divisional Division\n'
+ '\n'
+ 'Cognitive Science Department\n'
+ '\n'
+ '\n'
+ '\n'
+ '\n';

it('gets schedule type', () => {
  let parsedScheduleType = baseParser.parseScheduleType(text);
  expect(parsedScheduleType).toBe('Research Project');

  parsedScheduleType = baseParser.parseScheduleType('Welcome to SearchNEU!');
  expect(parsedScheduleType).toBeNull();
});

it('credit test', () => {
  let creditsParsed = baseParser.parseCredits(text);
  expect(creditsParsed.minCredits).toBe(1);
  expect(creditsParsed.maxCredits).toBe(2);

  creditsParsed = baseParser.parseCredits('3 to 5 credits');
  expect(creditsParsed.minCredits).toBe(3);
  expect(creditsParsed.maxCredits).toBe(5);

  // min cant be greater than max
  creditsParsed = baseParser.parseCredits('8 to 5 credit hours');
  expect(creditsParsed.minCredits).toBe(5);
  expect(creditsParsed.maxCredits).toBe(5);


  // min cant be greater than max
  creditsParsed = baseParser.parseCredits('Credit Hours: 8.000');
  expect(creditsParsed.minCredits).toBe(8);
  expect(creditsParsed.maxCredits).toBe(8);
});

it('simplifySymbols', () => {
  const a = baseParser.simplifySymbols('‚‚‚„„„');
  expect(a).toBe('\'\'\'"""');
});

it('credit parser can parse Continuing Education Units ', () => {
  const credits = baseParser.parseCredits('// 0.800 Continuing Education Units ');
  expect(credits.minCredits).toBe(0.8);
  expect(credits.maxCredits).toBe(0.8);
});
