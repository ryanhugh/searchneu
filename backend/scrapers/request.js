/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

// ESLint added some new rules that require one class per file.
// That is generally a good idea, perhaps we could change over this file one day.
/* eslint-disable max-classes-per-file */

import request from 'request-promise-native';
import URI from 'urijs';
import asyncjs from 'async';
import objectHash from 'object-hash';
import moment from 'moment';
import _ from 'lodash';
import dnsCache from 'dnscache';

import cache from './cache';
import macros from '../macros';

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
// Saves all pages to disk in development so parsers are faster and don't need to hit actuall websites to test updates for scrapers
// ignores request cookies when matching request for caching
// see the request function for details about input (same as request input + some more stuff) and output (same as request 'response' object + more stuff)


// Would it be worth to assume that these sites have a cache and hit all the subjects, and then hit all the classes, etc?
// So assume that when you hit one subject it caches that subject and others nearby.


// TODO:
// Sometimes many different hostnames all point to the same IP. Need to limit requests by an IP basis and a hostname basis (COS).
// Need to improve the cache. Would save everything in one object, but 268435440 (268 MB) is roughly the max limit of the output of JSON.stringify.
// https://github.com/nodejs/node/issues/9489#issuecomment-279889904


// This object must be created once per process
// Attributes are added to this object when it is used
// This is the total number of requests per host
// If these numbers ever exceed 1024, might want to ensure that there are more file descriptors available on the OS for this process
// than we are trying to request. Windows has no limit and travis has it set to 500k by default, but Mac OSX and Linux Desktop often have them
// set really low (256) which could interefere with this.
// https://github.com/request/request
const separateReqDefaultPool = { maxSockets: 50, keepAlive: true, maxFreeSockets: 50 };

// Specific limits for some sites. CCIS has active measures against one IP making too many requests
// and will reject request if too many are made too quickly.
// Some other schools' servers will crash/slow to a crawl if too many requests are sent too quickly.
const separateReqPools = {
  'www.ccis.northeastern.edu': { maxSockets: 8, keepAlive: true, maxFreeSockets: 8 },
  'www.khoury.northeastern.edu': { maxSockets: 8, keepAlive: true, maxFreeSockets: 8 },

  // Needed for https://www.northeastern.edu/cssh/faculty
  // Looks like northeastern.edu is just a request redirector and sends any requests for /cssh to another server
  // This is the server that was crashing when tons of requests were sent to /cssh
  // So only requests to /cssh would 500, and not all of northeastern.edu.
  'www.northeastern.edu': { maxSockets: 25, keepAlive: true, maxFreeSockets: 25 },

  'genisys.regent.edu':  { maxSockets: 50, keepAlive: true, maxFreeSockets: 50 },
  'prod-ssb-01.dccc.edu':  { maxSockets: 100, keepAlive: true, maxFreeSockets: 100 },
  'telaris.wlu.ca':  { maxSockets: 400, keepAlive: true, maxFreeSockets: 400 },
  'myswat.swarthmore.edu':  { maxSockets: 1000, keepAlive: true, maxFreeSockets: 1000 },
  'bannerweb.upstate.edu':  { maxSockets: 200, keepAlive: true, maxFreeSockets: 200 },

  // Took 1hr and 15 min with 500 sockets and RETRY_DELAY set to 20000 and delta set to 15000.
  // Usually takes just under 1 hr at 1k sockets and the same timeouts.
  // Took around 20 min with timeouts set to 100ms and 150ms and 100 sockets.
  'wl11gp.neu.edu':  { maxSockets: 100, keepAlive: true, maxFreeSockets: 100 },
};

// Enable the DNS cache. This module replaces the .lookup method on the built in dns module to cache lookups.
// The old way of doing DNS caching was to do a dns lookup of the domain before the request was made,
// and then swap out the domain with the ip in the url. (And cache the dns lookup manually.)
// Use this instead of swapping out the domain with the ip in the fireRequest function so the cookies still work.
// (There was some problems with saving them because, according to request, the host was the ip, but the cookies were configured to match the domain)
// It would be possible to go back to manual dns lookups and therefore manual cookie jar management if necessary (wouldn't be that big of a deal).
// https://stackoverflow.com/questions/35026131/node-override-request-ip-resolution
// https://gitter.im/request/request
// https://github.com/yahoo/dnscache
dnsCache({
  enable: true,
  ttl: 999999999,
  cachesize: 999999999,
});


const MAX_RETRY_COUNT = 35;

// These numbers are in ms.
const RETRY_DELAY = 100;
const RETRY_DELAY_DELTA = 150;

const LAUNCH_TIME = moment();

class Request {
  constructor() {
    this.openRequests = 0;

    // Stuff for analytics on a per-hostname basis.
    this.analytics = {};

    // Hostnames that had a request since the last call to onInterval.
    this.activeHostnames = {};

    // Template for each analytics object
    // totalBytesDownloaded: 0,
    //   totalErrors: 0,
    //   totalGoodRequests: 0,
    //   startTime: null

    // Log the progress of things every 5 seconds
    this.timer = null;
  }

  ensureAnalyticsObject(hostname) {
    if (this.analytics[hostname]) {
      return;
    }

    this.analytics[hostname] = {
      totalBytesDownloaded: 0,
      totalErrors: 0,
      totalGoodRequests: 0,
      startTime: null,
    };
  }

  getAnalyticsFromAgent(pool) {
    let agent = pool['https:false:ALL'];

    if (!agent) {
      agent = pool['http:'];
    }

    if (!agent) {
      macros.log('Agent is false,', pool);
      return {};
    }

    const moreAnalytics = {
      socketCount: 0,
      requestCount: 0,
      maxSockets: pool.maxSockets,
    };

    const socketArrays = Object.values(agent.sockets);
    for (const arr of socketArrays) {
      moreAnalytics.socketCount += arr.length;
    }

    const requestArrays = Object.values(agent.requests);
    for (const arr of requestArrays) {
      moreAnalytics.requestCount += arr.length;
    }
    return moreAnalytics;
  }

  onInterval() {
    const analyticsHostnames = Object.keys(this.analytics);

    for (const hostname of analyticsHostnames) {
      if (!this.activeHostnames[hostname]) {
        continue;
      }
      if (!separateReqPools[hostname]) {
        macros.log(hostname);
        macros.log(JSON.stringify(this.analytics[hostname], null, 4));
        continue;
      }

      const moreAnalytics = this.getAnalyticsFromAgent(separateReqPools[hostname]);

      const totalAnalytics = {};
      Object.assign(totalAnalytics, moreAnalytics, this.analytics[hostname]);

      macros.log(hostname);
      macros.log(JSON.stringify(totalAnalytics, null, 4));

      // Also log the event to Amplitude.
      totalAnalytics.hostname = hostname;
      macros.logAmplitudeEvent('Scrapers', totalAnalytics);
    }

    this.activeHostnames = {};

    // Shared pool
    const sharedPoolAnalytics = this.getAnalyticsFromAgent(separateReqDefaultPool);
    macros.log(JSON.stringify(sharedPoolAnalytics, null, 4));

    // Also upload it to Amplitude.
    sharedPoolAnalytics.hostname = 'shared';
    macros.logAmplitudeEvent('Scrapers', sharedPoolAnalytics);

    if (this.openRequests === 0) {
      clearInterval(this.timer);
    }

    // Log the current time.
    const currentTime = moment();
    macros.log('Uptime:', moment.duration(moment().diff(LAUNCH_TIME)).asMinutes(), `(${currentTime.format('h:mm:ss a')})`);
  }

  async fireRequest(config) {
    // Default to JSON for POST bodies
    if (config.method === 'POST' && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    const urlParsed = new URI(config.url);

    const hostname = urlParsed.hostname();
    this.ensureAnalyticsObject(hostname);
    this.activeHostnames[hostname] = true;

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

    // Fifteen min. This timeout does not include the time the request is waiting for a socket.
    // Just increased from 5 min to help with socket hang up errors.
    defaultConfig.timeout = 15 * 60 * 1000;

    defaultConfig.resolveWithFullResponse = true;

    // Allow fallback to old depreciated insecure SSL ciphers. Some school websites are really old  :/
    // We don't really care abouzt security (hence the rejectUnauthorized: false), and will accept anything.
    // Additionally, this is needed when doing application layer dns caching because the url no longer matches the url in the cert.
    defaultConfig.rejectUnauthorized = false;
    defaultConfig.requestCert = false;
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

    output.headers = headers;

    macros.verbose('Firing request to', output.url);

    // If there are not any open requests right now, start the interval
    // Only start the logging interval on production on AWS, only start it on Travis
    if (this.openRequests === 0 && (!macros.PROD || process.env.CI)) {
      clearInterval(this.timer);
      macros.log('Starting request analytics timer.');
      this.analytics[hostname].startTime = Date.now();
      this.timer = setInterval(() => this.onInterval(), 5000);
      setTimeout(() => {
        this.onInterval();
      }, 0);
    }

    this.openRequests++;
    let response;
    let error;
    try {
      response = await request(output);
    } catch (e) {
      error = e;
    }
    this.openRequests--;


    if (this.openRequests === 0 && (!macros.PROD || process.env.CI)) {
      macros.log('Stopping request analytics timer.');
      clearInterval(this.timer);
    }

    if (error) {
      throw error;
    }


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

  safeToCacheByUrl(config) {
    if (config.method !== 'GET') {
      return false;
    }

    // If the only header is Cookie and the only items in the config are url and method===get and headers,
    // The request is safe to cache by just the url, and no hashing is required.
    // The vast majority of requests follow these rules.
    const listOfHeaders = Object.keys(config.headers);

    _.pull(listOfHeaders, 'Cookie');
    if (listOfHeaders.length > 0) {
      const configToLog = {};
      Object.assign(configToLog, config);
      configToLog.jar = null;

      macros.log('Not caching by url b/c it has other headers', listOfHeaders, configToLog);
      return false;
    }

    const listOfConfigOptions = Object.keys(config);

    _.pull(listOfConfigOptions, 'method', 'headers', 'url', 'requiredInBody', 'cacheName', 'jar', 'cache');

    if (listOfConfigOptions.length > 0) {
      macros.log('Not caching by url b/c it has other config options', listOfConfigOptions);
      return false;
    }

    return true;
  }

  // Outputs a response object. Get the body of this object with ".body".
  async request(config) {
    macros.verbose('Request hitting', config);

    const urlParsed = new URI(config.url);
    const hostname = urlParsed.hostname();
    this.ensureAnalyticsObject(hostname);

    let newKey;

    if (macros.DEV && config.cache) {
      // Skipping the hashing when it is not necessary significantly speeds this up.
      // When everything was hashed, the call to objectHash function was the function with the most self-time in the profiler lol.
      // Caching by url is faster, so log a warning if had to cache by hash.
      if (this.safeToCacheByUrl(config)) {
        newKey = config.url;
      } else {
        // Make a new request without the cookies and the cookie jar.
        const headersWithoutCookie = {};
        Object.assign(headersWithoutCookie, config.headers);
        headersWithoutCookie.Cookie = undefined;

        const configToHash = {};
        Object.assign(configToHash, config);
        configToHash.headers = headersWithoutCookie;
        configToHash.jar = undefined;

        newKey = objectHash(configToHash);
      }

      const content = await cache.get(macros.REQUESTS_CACHE_DIR, config.cacheName, newKey);
      if (content) {
        return content;
      }
    }

    let retryCount = MAX_RETRY_COUNT;
    if (config.retryCount) {
      retryCount = config.retryCount;
    }

    return new Promise((resolve, reject) => {
      let tryCount = 0;

      let requestDuration;

      asyncjs.retry({
        times: retryCount,
        interval: RETRY_DELAY + Math.round(Math.random() * RETRY_DELAY_DELTA),
      }, async (callback) => {
        let response;
        tryCount++;
        try {
          const requestStart = Date.now();
          response = await this.fireRequest(config);
          requestDuration = Date.now() - requestStart;
          this.analytics[hostname].totalGoodRequests++;
        } catch (err) {
          // Most sites just give a ECONNRESET or ETIMEDOUT, but dccc also gives a EPROTO and ECONNREFUSED.
          // This will retry for any error code.

          this.analytics[hostname].totalErrors++;
          if (!macros.PROD || tryCount > 5) {
            macros.log('Try#:', tryCount, 'Code:', err.statusCode || err.RequestError || err.Error || err.message || err, ' Open request count: ', this.openRequests, 'Url:', config.url);
          }

          if (err.response) {
            macros.verbose(err.response.body);
          } else {
            macros.verbose(err.message);
          }

          callback(err);
          return;
        }

        // Ensure that body contains given string.
        if (config.requiredInBody && !this.doAnyStringsInArray(config.requiredInBody, response.body)) {
          macros.log('Try#:', tryCount, 'Warning, body did not contain specified text', response.body.length, response.statusCode, this.openRequests, config.url);
          callback('Body missing required text.');
          return;
        }

        if (response.body.length < 4000 && !config.shortBodyWarning === false) {
          macros.log('Warning, short body', config.url, response.body, this.openRequests);
        }

        callback(null, response);
      }, async (err, response) => {
        if (err) {
          reject(err);
          return;
        }

        // Save the response to a file for development
        if (macros.DEV && config.cache) {
          cache.set(macros.REQUESTS_CACHE_DIR, config.cacheName, newKey, response.toJSON(), true);
        }

        // Don't log this on travis because it causes more than 4 MB to be logged and travis will kill the job
        this.analytics[hostname].totalBytesDownloaded += response.body.length;
        if (!macros.PROD) {
          macros.log('Parsed', response.body.length, 'in', requestDuration, 'ms from ', config.url);
        }

        resolve(response);
      });
    });
  }
}


const instance = new Request();


class RequestInput {
  constructor(cacheName, config = {}) {
    this.cacheName = cacheName;
    this.config = config;

    // Use the cache if it was not specified in the config
    if (this.config.cache === undefined) {
      this.config.cache = true;
    }
  }

  async request(config) {
    const output = {};
    config = this.standardizeInputConfig(config);

    // Use the fields from this.config that were not specified in cache.
    Object.assign(output, this.config, config);

    return instance.request(output);
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

    if (!config.method) {
      config.method = method;
    }

    if (macros.DEV) {
      if (this.cacheName) {
        config.cacheName = this.cacheName;
      } else {
        // Parse the url hostname from the url.
        config.cacheName = new URI(config.url).hostname();
      }
    }

    return config;
  }

  static get(config) {
    return new this().get(config);
  }

  // Helpers for get and post
  async get(config) {
    if (!config) {
      macros.error('Warning, request get called with no config');
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
      macros.error('Warning, request post called with no config');
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
      macros.error('Warning, request head called with no config');
      return null;
    }
    if (typeof config === 'string') {
      return this.request({
        url: config,
        method: 'HEAD',
      });
    }

    config.method = 'HEAD';
    return instance.request(config);
  }

  // Pass through methods to deal with cookies.
  jar() {
    return request.jar();
  }

  cookie(cookie) {
    return request.cookie(cookie);
  }

  // Do a head request. If that fails, do a get request. If that fails, the site is down and return false
  // need to turn off high retry count
  async isPageUp() {
    throw new Error('This does not work yet');
  }
}


export default RequestInput;
