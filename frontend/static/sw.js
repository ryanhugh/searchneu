/*
 * Copyright (c) 2017 Ryan Hughes
 *
 * This file is part of CoursePro.
 *
 * CoursePro is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License
 * version 3 as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */


// More info about service workers:
// https://serviceworke.rs/
// This was created from this: https://googlechrome.github.io/samples/service-worker/read-through-caching/
// and many other places on the internet

const CACHE_NAME = 'main';

addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

// Fetches a request and caches the response in the cache if it is a valid response.
// If the response is needed elsewhere, set shouldReturnResponse to true to return the reponse too.
function fetchAndCache(request, cache, shouldReturnResponse) {
  //update the cache
  return fetch(request).then((response) => {
    // responses from the same domain. See https://fetch.spec.whatwg.org/#concept-response-type
    let retVal;
    if (shouldReturnResponse) {
      retVal = response.clone();
    }
    if (response.status < 400 && response.type === 'basic') {
      cache.put(request, response);
    }
    if (retVal) {
      return retVal;
    }

    return null;
  });
}


function go(request) {
  const startTime = new Date().getTime();

  return caches.open(CACHE_NAME).then((cache) => {
    const cacheOpen = new Date().getTime();
    console.log('it took ', (cacheOpen - startTime), ' to open the cache for', request.url);

    // If the cache is not updated, hit the internet and return from the cache
    const urlSplit = request.url.split('?');
    if (urlSplit.length > 1 && urlSplit[1].includes('loadFromCache=false')) {
      console.log('Was told there was nothing in the cache, skipping.');
      return fetchAndCache(request, cache, true);
    }

    return cache.match(request).then((response) => {
      const matched = new Date().getTime();
      console.log('it took ', (matched - cacheOpen), ' to load a match for', request.url);


      if (response) {
        // If there is an entry in the cache for event.request, then response will be defined
        // and we can just return it.
        // console.log(' Found response in cache:', response);
        fetchAndCache(request, cache, false);
        return response;
      }

      console.error('Thought there was something in the cache but there wasent?', request.url);
      return fetchAndCache(request, cache, true);
    }).catch((error) => {
      // This catch() will handle exceptions that arise from the match() or fetch() operations.
      // Note that a HTTP error response (e.g. 404) will NOT trigger an exception.
      // It will return a normal response object that has the appropriate error code set.
      console.error('  Read-through caching failed:', error);
      if (error && error.stack) {
        console.error(error.stack);
      }

      throw error;
    });
  });
}


addEventListener('fetch', (event) => {
  const url = event.request.url;
  if (url.startsWith('data:')) {
    return;
  }

  if (event.request.method !== 'GET') {
    return;
  }

  if (url.endsWith('.js') || url.endsWith('.css')) {
    return;
  }

  if (url.includes('localhost:5000/data') || url.includes('searchneu.com/data')) {
    console.log('caching ', url);
    event.respondWith(go(event.request));
  }
});
