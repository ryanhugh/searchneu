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

import request from 'request-promise-native';
import URI from 'urijs';
import fs from 'fs-promise';
import async from 'async';
import dns from 'dns-then';
import mkdirp from 'mkdirp-promise';
import objectHash from 'object-hash';
import path from 'path';

import utils from './utils';
import macros from './macros';

// This file is a transparent wrapper around the request library that changes some default settings so scraping is a lot faster.
// This file adds:
// Automatic retry, with a delay in between reqeusts.
// Limit the max number of simultaneous requests (this used to be done with d3-queue, but is now done with agent.maxSockets)
// Application layer DNS cacheing. The request library (and the built in http library) will do a separate DNS lookup for each request
//    This DNS cacheing will do one DNS lookup per hostname (www.ccis.northeastern.edu, wl11gp.neu.edu) and cache the result.
//    This however, does change the URL that is sent to the request library (hostname -> pre-fetched ip), which means that the https verificaton will be comparing
//    the URL in the cert with the IP in the url, which will fail. Need to disable https verification for this to work.
// Keep-alive connections. Keep TCP connections open between requests. This significantly speeds up scraping speeds (1hr -> 20min)
// Ignore invalid HTTPS certificates and outdated ciphers. Some school sites have really old and outdated sites. We want to scrape them even if their https is misconfigured.

// In progress: save all pages to disk so development of parsers is faster and don't need to hit prod to test updates for scrapers

// This object must be created once per process
// Attributes are added to this object when it is used
// This is the total number of requests per host
// https://github.com/request/request
const separateReqDefaultPool = { maxSockets: 10000, keepAlive: true, maxFreeSockets: 10000 };

// Specific limits for some sites. CCIS will reject request if too many are made too quickly.
// Some other schools' servers will crash/slow to a crawl if too many requests are sent too quickly.
const separateReqPools = {
  'www.ccis.northeastern.edu': { maxSockets: 10, keepAlive: true, maxFreeSockets: 10 },
};

const MAX_RETRY_COUNT = 35;

// These numbers are in ms.
const RETRY_DELAY = 20000;
const RETRY_DELAY_DELTA = 15000;

class Request {

  constructor() {
    this.openRequests = 0;

    this.dnsPromises = {};
  }

  // By default, needle and nodejs does a DNS lookup for each request.
  // Avoid that by only doing a dns lookup once per domain
  async getDns(hostname) {
    if (this.dnsPromises[hostname]) {
      return this.dnsPromises[hostname];
    }

    // Just the host + subdomains are needed, eg blah.google.com
    if (hostname.startsWith('http://') || hostname.startsWith('https://')) {
      utils.elog(hostname);
    }

    const promise = dns.lookup(hostname, {
      all: true,
      family: 4,
    });

    this.dnsPromises[hostname] = promise;

    const result = await promise;

    if (result.length > 1) {
      console.log('INFO: more than 1 dns result', result);
    }

    return result;
  }


  standardizeInputConfig(config, method = 'GET') {
    if (typeof config === 'string') {
      config = {
        method: method,
        url: config,
      };
    }

    if (!config.headers) {
      config.headers = {};
    }

    return config;
  }


  async fireRequest(config) {
    config = this.standardizeInputConfig(config);


    // Default to JSON for POST bodies
    if (config.method === 'POST' && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    const urlParsed = new URI(config.url);

    const hostname = urlParsed.hostname();

    const dnsResults = await this.getDns(urlParsed.hostname());


    let ip;
    if (dnsResults.length === 0) {
      utils.elog('DNS lookup returned 0 results!', JSON.stringify(config));
      return null;
    } else if (dnsResults.length === 1) {
      ip = dnsResults[0].address;
    } else {
      const index = Math.floor(Math.random() * dnsResults.length);
      ip = dnsResults[index].address;
    }

    // Make the start of the new url with the ip from the DNS lookup and the protocol from the url
    const urlStart = new URI(ip).protocol(urlParsed.protocol()).toString();

    // Then add on everything after the host
    const urlWithIp = new URI(urlParsed.resource()).absoluteTo(urlStart).port(urlParsed.port()).toString();


    // Setup the default config
    // Change some settings from the default request settings for
    const defaultConfig = {
      headers: {},
    };

    // Default to JSON for POST bodies
    if (config.method === 'POST') {
      defaultConfig.headers['Content-Type'] = 'application/json';
    }

    // Enable keep-alive to make sequential requests faster
    if (separateReqPools[hostname]) {
      defaultConfig.pool = separateReqPools[hostname];
    } else {
      defaultConfig.pool = separateReqDefaultPool;
    }

    //Ten min
    defaultConfig.timeout = 60 * 10000;

    defaultConfig.resolveWithFullResponse = true;

    // Allow fallback to old depreciated insecure SSL ciphers. Some school websites are really old  :/
    // We don't really care abouzt security (hence the rejectUnauthorized:false), and will accept anything.
    // Additionally, this is needed when doing application layer dns caching because the url no longer matches the url in the cert
    defaultConfig.rejectUnauthorized = false;
    defaultConfig.ciphers = 'ALL';

    // Set the host in the header to the hostname on the url.
    // This is not done automatically because of the application layer dns caching (it would be set to the ip instead)
    defaultConfig.headers.Host = hostname;

    defaultConfig.headers['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:24.0) Gecko/20100101 Firefox/24.0';


    //trololololol
    //Needed on some old sites that will redirect/block requests when this is not set
    //when a user is requesting a page that is not the entry page of the site
    //temple, etc
    defaultConfig.headers.Referer = config.url;


    // Merge the default config and the input config
    // Need to merge headers and output separately because config.headers object would totally override
    // defaultConfig.headers if merged as one object (Object.assign does shallow merge and not deep merge)
    const output = {};
    const headers = {};

    Object.assign(headers, defaultConfig.headers, config.headers);
    Object.assign(output, defaultConfig, config);

    output.url = urlWithIp;
    output.headers = headers;

    this.openRequests++;
    let response;
    try {
      response = await request(output);
    } catch (e) {
      this.openRequests --;
      throw e;
    }
    this.openRequests --;
    return response;
  }


  doAnyStringsInArray(array, body) {
    for (let i = 0; i < array.length; i++) {
      if (body.includes(array[i])) {
        return true;
      }
    }
    return false;
  }


  async request(config) {
    config = this.standardizeInputConfig(config);


    const urlParsed = new URI(config.url);

    let folder;
    let filename;
    let filePath;


    if (macros.DEV) {
      folder = path.join('request_cache', urlParsed.hostname());

      // Ensure only letters and numbers and dots and limit char length
      filename = urlParsed.path().replace(/[^A-Za-z0-9.]/gi, '_').trim().slice(0, 25) + objectHash(config);

      await mkdirp(folder);

      filePath = path.join(folder, filename);

      const exists = await fs.exists(filePath);

      if (exists) {
        const contents = JSON.parse((await fs.readFile(filePath)).toString());
        // console.log('Loaded ', contents.body.length, 'from cache', config.url);
        return contents;
      }
    }


    let tryCount = 0;

    return new Promise((resolve, reject) => {
      async.retry({
        times: MAX_RETRY_COUNT,
        interval: RETRY_DELAY + Math.round(Math.random() * RETRY_DELAY_DELTA),
      }, async (callback) => {
        let response;
        tryCount++;
        try {
          response = await this.fireRequest(config);
        } catch (err) {
          // Most sites just give a ECONNRESET or ETIMEDOUT, but dccc also gives a EPROTO and ECONNREFUSED.
          // This will retry for any error code.
          console.log('Try#:', tryCount, 'Code:', err.statusCode || err, ' Open request count: ', this.openRequests, 'Url:', config.url);
          callback(err);
          return;
        }

        // Ensure that body contains given string.
        if (config.requiredInBody && !this.doAnyStringsInArray(config.requiredInBody, response.body)) {
          console.log('Try#:', tryCount, 'Warning, body did not contain specified text', response.body.length, response.statusCode, this.openRequests, config.url);
          callback('Body missing required text.');
          return;
        } else if (response.body.length < 4000 && !config.shortBodyWarning === false) {
          console.log('Warning, short body', config.url, response.body, this.openRequests);
        }

        callback(null, response);
      }, async (err, response) => {
        if (err) {
          reject(err);
          return;
        }

        // Save the response to a file for development
        if (macros.DEV) {
          await fs.writeFile(filePath, JSON.stringify(response.toJSON()));
        }

        console.log('Parsed', response.body.length, 'from ', config.url);
        resolve(response);
      });
    });
  }

  // Helpers for get and post
  async get(config) {
    if (!config) {
      console.log('Warning, request called with no config');
      return null;
    }
    if (typeof config === 'string') {
      return this.request({
        url: config,
        method: 'GET',
      });
    }

    config.method = 'GET';
    return this.request(config);
  }

  async post(config) {
    if (!config) {
      console.log('Warning, request called with no config');
      return null;
    }
    if (typeof config === 'string') {
      return this.request({
        url: config,
        method: 'POST',
      });
    }

    config.method = 'POST';
    return this.request(config);
  }

  async head(config) {
    if (!config) {
      console.log('Warning, request called with no config');
      return null;
    }
    if (typeof config === 'string') {
      return this.request({
        url: config,
        method: 'HEAD',
      });
    }

    config.method = 'HEAD';
    return this.request(config);
  }

  // Do a head request. If that fails, do a get request. If that fails, the site is down and return false
  // need to turn off high retry count
  async isPageUp(config) {
    throw new Error('This does not work yet');
    // this.head(config)
  }


}


// async function test() {
//   const it = new Request();

//   try {
//     const d = await it.request({
//       url:'http://localhost',
//     });

//     console.log(d.body, 'NO CRASH');
//   } catch (e) {
//     console.log(e, 'HERE');
//   }
// }


const instance = new Request();



export default instance;
