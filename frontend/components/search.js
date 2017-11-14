import URI from 'urijs';

import request from './request';


class Search {

  constructor() {
    // Mapping of search term to an array of the results that have been loaded so far.
    this.cache = {};

    // Queries that have loaded all of the results, and no longer need to hit the server for any more.
    this.allLoaded = {};
  }


  // Min terms is the minimum number of terms needed.
  // When this function is called for the first time for a given query, it will be 4.
  // Then, on subsequent calls, it will be 14, 24, etc. (if increasing by 10)
  async search(query, termId, termCount) {
    // Searches are case insensitive.
    query = query.trim().toLowerCase();

    if (!query || query.length === 0) {
      console.log("No query given in frontend/search.js. Returning empty array.", query, termCount)
      return []
    }

    if (!termId || termId.length !== 6) {
      console.log("No termId given in frontend/search.js. Returning empty array.", termId, termCount)
      return []
    }

    let existingTermCount = 0;
    if (this.cache[termId + query]) {
      existingTermCount = this.cache[termId + query].length;
    }

    // Cache hit
    if (termCount <= existingTermCount && existingTermCount > 0 || this.allLoaded[termId + query]) {
      console.log('Cache hit.', this.allLoaded[termId + query]);
      return this.cache[termId + query].slice(0, termCount);
    }

    // If we got here, we need to hit the network.
    console.log('Requesting terms ', existingTermCount, 'to', termCount);


    const url = new URI('/search').query({
      query: query,
      termId: termId,
      minIndex: existingTermCount,
      maxIndex: termCount,
    }).toString();

    let startTime = Date.now()
    const results = await request.get(url);
    window.amplitude.logEvent('Search Timing', {query: query, time: Date.now() - startTime});

    if (results.error) {
      console.error("Error with networking request", results.error)
      return []
    }


    if (!this.cache[termId + query]) {
      this.cache[termId + query] = [];
    }

    // Add to the end of exiting results.
    this.cache[termId + query] = this.cache[termId + query].concat(results);

    if (results.length < termCount - existingTermCount) {
      this.allLoaded[termId + query] = true;
    }

    return this.cache[termId + query];
  }


}

export default new Search();
