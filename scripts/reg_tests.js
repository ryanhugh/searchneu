import { fromFile as classFromFile } from '../backend/scrapers/classes/searchIndex.js';
import { fromFile as employeeFromFile } from '../backend/scrapers/employees/searchIndex.js';
import path from 'path';
import fs from 'fs-extra';
import macros from '../backend/macros';
import request from '../frontend/components/request.js';

async function loadIndex(url, filePath, fromFile) {
  const localPath = path.join(macros.PUBLIC_DIR, filePath);

  const resp = await request.get(url);
  const results = resp.results;

  console.log(results);

  await fs.writeFile(localPath, results);
  return fromFile(localPath);
}

async function loadIndices() {
  await loadIndex("https://searchneu.com/data/v2/getTermDump/allTerms.json", "/public/data/v2/getTermDump/allTerms.json", classFromFile);
  await loadIndex("https://searchneu.com/data/v2/employeeDump.json", "/public/data/v2/employeeDump.json", employeeFromFile);
}

export default loadIndices;
