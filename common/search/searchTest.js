import fs from 'fs-promise';
import search from './search';
import utils from '../../scrapers/utils'


async function test() {
  

  const termDump = JSON.parse(await fs.readFile('./public/data/getTermDump/neu.edu/201810.json'))
  const searchIndex = JSON.parse(await fs.readFile('./public/data/getSearchIndex/neu.edu/201810.json'))
  const employeeMap = JSON.parse(await fs.readFile('./public/data/employeeMap.json'))
  const employeesSearchIndex = JSON.parse(await fs.readFile('./public/data/employeesSearchIndex.json'))

  let index = search.create(termDump, searchIndex, employeeMap, employeesSearchIndex)

  console.log(JSON.stringify(index.search('cs 2500', 0, 5), null, 4))




}


test()