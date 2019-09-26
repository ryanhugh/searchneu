import fs from 'fs-extra';
import path from 'path';
import elastic from '../../elastic';
import classSearchIndex from '../../scrapers/classes/searchIndex';
import employeeSearchIndex from '../../scrapers/employees/searchIndex';

// would be nice to allocate a different port for testing, I think
beforeAll(() => {
  // may still need to reset the index or whatever
  await classSearchIndex.fromFile(await fs.readFile(path.join(__dirname, 'data', 'mockTermDump.json'), 'utf8'));
  await employeeSearchIndex.fromFile(await fs.readFile(path.join(__dirname, 'data', 'mockEmployeeDump.json'), 'utf8'));


  // const classDump = JSON.parse(await fs.readFile(path.join(__dirname, 'data', 'mockTermDump.json'), 'utf8'));
  // const employeeDump = JSON.parse(await fs.readFile(path.join(__dirname, 'data', 'mockEmployeeData.json'), 'utf8'));

  // find the mapping, get it the same way yarn index gets it
  // await elastic.resetIndex(elastic.CLASS_INDEX, classMapping);
  // await elastic.resetIndex(elastic.EMPLOYEE_INDEX, employeeMapping);
  // await bulkIndexFromMap(elastic.CLASS_INDEX, classDump);
  // await bulkIndexFromMap(elastic.EMPLOYEE_INDEX, employeeDump);
});

// do I want to do any teardown?
afterAll(() => {});

it('works', () => {
  await elastic.search('hello', '202010', 0, 10);
});
