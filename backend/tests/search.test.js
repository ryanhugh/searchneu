import fs from 'fs-extra';
import path from 'path';
import elastic from '../elastic';
import { fromFile as indexClassesFromFile } from '../scrapers/classes/searchIndex';
import { fromFile as indexEmployeesFromFile } from '../scrapers/employees/searchIndex';

// would be nice to allocate a different port for testing, I think

describe('elastic', () => {
  beforeAll(async () => {
    await indexClassesFromFile(await fs.readFile(path.join(__dirname, 'data', 'mockTermDump.json'), 'utf8'));
    await indexEmployeesFromFile(await fs.readFile(path.join(__dirname, 'data', 'employeeMap.json'), 'utf8'));
  });

  it('works', async () => {
    await elastic.search('hello', '202010', 0, 10);
  });
});
