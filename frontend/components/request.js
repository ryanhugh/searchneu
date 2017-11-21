/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import URI from 'urijs';
import asyncjs from 'async';
import macros from './macros';

// All the requests from the frontend to the backend go through this file.
// There used to be a lot of logic in here for loading the term dump from the service worker cache/IDB, etc

// Some background on different storage options in the browser:
// localstorage
//  -- limit of 5MB
// filesystem api
//  -- depreciated, chrome only. https://www.html5rocks.com/en/tutorials/file/filesystem/
//  -- requestFileSystem
// WebSQL
//  - also depreciated, last updated in 2010
// IndexedDB
// - Looked good, but is slow and blocks the DOM.
// - Takes about 3-5 seconds to load everything on desktop, more on mobile
// - Could theoretically access it from a webworker to stop it from blocking the DOM
// - but in that case it might just be better to use Service Worker Cache

// One thing that would be cool is if the entire search could happen offline
// Which is totally possible as long as we are using elasticlunr
// But would need a bunch of seconds to download all of the term data
// and a couple seconds to load the data when the page was opened.

// Prefix to store keys in localstorage
const LOCALSTORAGE_PREFIX = 'request_cache';
const MS_PER_DAY = 86400000;

class Request {
  isKeyUpdated(key) {
    const storedValue = window.localStorage[LOCALSTORAGE_PREFIX + key];

    if (!storedValue) {
      return false;
    }

    const now = Date.now();

    if (now - parseInt(storedValue, 10) > MS_PER_DAY) {
      return false;
    }
    return true;
  }

  // Returns true if the cache has all of the keys specified, and they are all < 24 Hr old.
  // If this returns false, the request code will go directly to the internet
  cacheIsUpdatedForKeys(keys) {
    for (const key of keys) {
      if (!this.isKeyUpdated(key)) {
        return false;
      }
    }

    return true;
  }


  async getFromInternet(url, config = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const xmlhttp = new XMLHttpRequest();
      xmlhttp.onreadystatechange = function onreadystatechange() {
        if (xmlhttp.readyState !== 4) {
          return;
        }

        const requestTime = Date.now() - startTime;
        macros.log('Downloading took ', requestTime, 'for url', url);

        if (xmlhttp.status !== 200) {
          let err;
          if (xmlhttp.statusText) {
            err = xmlhttp.statusText;
          } else if (xmlhttp.response) {
            err = xmlhttp.response;
          } else {
            err = `unknown ajax error${String(xmlhttp.status)}`;
          }

          err += `config = ${JSON.stringify(url)}`;

          macros.warn('error, bad code recievied', xmlhttp.status, err, url);

          reject(err);
          return;
        }

        const startParse = Date.now();
        const response = JSON.parse(xmlhttp.response);
        const parsingTime = Date.now() - startParse;
        macros.log('Parsing took ', parsingTime, 'for url', url);

        if (response.error) {
          macros.warn('ERROR networking error bad reqeust?', url);
        }

        resolve(response);
      };

      if (config.progressCallback) {
        xmlhttp.addEventListener('progress', (evt) => {
          if (evt.lengthComputable) {
            config.progressCallback(evt.loaded, evt.total);
          }
        }, false);
      }


      xmlhttp.open('GET', url, true);
      xmlhttp.send();
    });
  }


  async getFromInternetWithRetry(url, config) {
    return new Promise((resolve, reject) => {
      asyncjs.retry({
        times: 3,
        interval: 500,
      }, async (callback) => {
        let resp;
        try {
          resp = await this.getFromInternet(url, config);
          callback(null, resp);
        } catch (e) {
          callback(e);
        }
      }, (err, resp) => {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      });
    });
  }


  async get(config) {
    if (typeof config === 'string') {
      config = {
        url: config,
      };
    } else if (Object.keys(config).length > 3) {
      macros.error('Nothing is supported except JSON GET requests with an option for caching in sw (and progress callback).', config);
    }


    if (!config.useCache) {
      return this.getFromInternetWithRetry(config.url);
    }

    let url = config.url;

    // Add a key that tells the service worker whether the cache is up to date.
    let isKeyUpdated;
    if (config.useCache) {
      isKeyUpdated = this.isKeyUpdated(config.url);
      url = new URI(config.url).query({ loadFromCache: isKeyUpdated }).toString();
    }

    const internetValue = await this.getFromInternetWithRetry(url, config);

    if (config.useCache) {
      window.localStorage[LOCALSTORAGE_PREFIX + config.url] = Date.now();
    }


    return internetValue;
  }
}

export default new Request();
