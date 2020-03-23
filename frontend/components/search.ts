/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import URI from 'urijs';

import macros from './macros';
import request from './request';
import { SearchItem, FilterSelection } from './types';

// Every time there is a breaking change in the search api, increment the version
// This way, the backend will send back the result that frontend is expecting
// Even though this is a website and we deploy the frontend and the backend at the same time
// old version of the frontend may remain in browser's cache for a bit.
// Old versions don't stay around for too long, though.
const apiVersion = 2;

class Search {
  cache: {[id: string]: SearchItem[]}

  allLoaded: {[id: string]: boolean}

  constructor() {
    // Mapping of search term to an object which contains three fields,
    // the results that have been loaded so far, the subjectName (if it exists),
    // and subjectCount (if it exists)
    this.cache = {};

    // Queries that have loaded all of the results, and no longer need to hit the server for any more.
    this.allLoaded = {};
  }


  // Clears the cache stored in this module.
  // Used for testing.
  clearCache() {
    this.cache = {};
    this.allLoaded = {};
  }

  // Min terms is the minimum number of terms needed.
  // When this function is called for the first time for a given query, it will be 4.
  // Then, on subsequent calls, it will be 14, 24, etc. (if increasing by 10) (set by termCount)
  async search(query: string, termId: string, filters: FilterSelection, termCount: number): Promise<SearchItem[]> {
    // Searches are case insensitive.
    query = query.trim().toLowerCase();

    if (query.length === 0) {
      macros.log('No query given in frontend/search.js. Returning empty array.', query, termCount);
      return [];
    }

    if (!termId || termId.length !== 6) {
      macros.log('No termId given in frontend/search.js. Returning empty array.', termId, termCount);
      return [];
    }

    const stringFilters = JSON.stringify({
      nupath: filters.NUpath,
      subject: filters.subject,
      online: filters.online,
      classType: filters.classType,
      sectionsAvailable: !filters.showUnavailable,
    });

    const searchHash = termId + query + stringFilters;

    // if in cache, set appropriate term count
    let existingTermCount = 0;
    if (this.cache[searchHash]) {
      existingTermCount = this.cache[searchHash].length;
    }

    // Cache hit
    if (termCount <= existingTermCount && existingTermCount > 0 || this.allLoaded[searchHash]) {
      macros.log('Cache hit.', this.allLoaded[searchHash]);
      return this.cache[searchHash].slice(0, termCount)
    }

    // If we got here, we need to hit the network.
    macros.log('Requesting terms ', existingTermCount, 'to', termCount);


    const url = new URI('/search').query({
      query: query,
      termId: termId,
      minIndex: existingTermCount,
      maxIndex: termCount,
      apiVersion: apiVersion,
      filters: stringFilters,
    }).toString();

    // gets results
    const startTime = Date.now();
    const waitedRequest = await request.get(url);

    const results = waitedRequest.results;
    macros.logAmplitudeEvent('Search Timing', {
      query: query.toLowerCase(),
      time: Date.now() - startTime,
      startIndex: existingTermCount,
      endIndex: termCount,
    });

    if (results.error) {
      macros.error('Error with networking request', results.error);
      return [];
    }

    // if cache doesn't exist, instantiate. Subject info only changed here
    // since it should only be changed on cache misses
    if (!this.cache[searchHash]) {
      this.cache[searchHash] = [];
    }

    // Add to the end of exiting results.
    this.cache[searchHash] = this.cache[searchHash].concat(results);


    if (results.length < termCount - existingTermCount) {
      this.allLoaded[searchHash] = true;
    }

    // Slice the array, so that if we modify the cache here it doesn't affect the instance we return.
    const retVal = this.cache[searchHash].slice(0);

    return retVal;
  }
}

export default new Search();
