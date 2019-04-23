/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import { Client } from '@elastic/elasticsearch';
import words from './wordlist.json';

// A little script to test the speed of elasticsearch queries.


const Elastic = new Client({ node: 'http://192.168.99.100:9200' });

async function searchWord(word) {
  const searchOutput = await Elastic.search({
    index: 'items',
    from: 0,
    size: 10,
    body: {
      query: {
        bool: {
          must: {
            multi_match: {
              query: word,
              fields: [
                'class.name',
                'class.code^2',
                'sections.meetings.profs',
                'employee.name^2',
                'employee.emails',
                'employee.phone',
              ],
            },
          },
        },
      },
    },
  });
  return searchOutput.body;
}

function median(arr) {
  const mid = Math.floor(arr.length / 2);
  const nums = [...arr].sort((a, b) => { return a - b; });
  return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}

async function searchAll() {
  const times = [];
  const numResults = [];
  const promises = words.map(async (word) => {
    try {
      const body = await searchWord(word);
      // Only add this if we receive non-zero results back.
      if (body.hits.total.value > 0) {
        times.push(body.took);
        numResults.push(body.hits.total.value);
      }
    } catch (e) {
      console.log(e);
    }
  });
  await Promise.all(promises);
  console.log('Total queries: ', words.length);
  console.log('Queries with results: ', times.length);
  console.log('Median # of results: ', median(numResults));
  console.log('Median time (ms): ', median(times));
  console.log('Mean time (ms): ', times.reduce((acc, c) => { return acc + c; }, 0) / times.length);
}

if (require.main === module) {
  searchAll();
}
