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
  async search(query, termCount) {
    // Searches are case insensitive.
    query = query.trim().toLowerCase();

    let existingTermCount = 0;
    if (this.cache[query]) {
      existingTermCount = this.cache[query].length;
    }

    // Cache hit
    if (termCount <= existingTermCount && existingTermCount > 0 || this.allLoaded[query]) {
      console.log('Cache hit.', this.allLoaded[query]);
      return this.cache[query].slice(0, termCount);
    }

    // If we got here, we need to hit the network.
    console.log('Requesting terms ', existingTermCount, 'to', termCount);


    const url = new URI('/search').query({
      query: query,
      minIndex: existingTermCount,
      maxIndex: termCount,
    }).toString();

    let startTime = Date.now()
    const results = await request.get(url);
    window.amplitude.logEvent('Search Timing', {query: query, time: Date.now() - startTime});


    if (!this.cache[query]) {
      this.cache[query] = [];
    }

    // Add to the end of exiting results.
    this.cache[query] = this.cache[query].concat(results);

    if (results.length < termCount - existingTermCount) {
      this.allLoaded[query] = true;
    }

    return this.cache[query];
  }


}

export default new Search();
