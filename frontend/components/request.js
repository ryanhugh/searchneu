import URI from 'urijs';


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


  async getFromInternet(url, config = {}, isKeyUpdated) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      const xmlhttp = new XMLHttpRequest();
      xmlhttp.onreadystatechange = function onreadystatechange() {
        if (xmlhttp.readyState !== 4) {
          return;
        }

        const requestTime = Date.now() - startTime;
        console.log('Downloading took ', requestTime, 'for url', url);
        if (isKeyUpdated && config.useCache) {
          ga('send', 'timing', url, 'download_cache_hit', requestTime);
        }
        else {
          ga('send', 'timing', url, 'download_cache_miss', requestTime);
        }


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

          console.warn('error, bad code recievied', xmlhttp.status, err, url);

          reject(err);
          return;
        }

        const startParse = Date.now();
        const response = JSON.parse(xmlhttp.response);
        const parsingTime = Date.now() - startParse;
        console.log('Parsing took ', parsingTime, 'for url', url);
        ga('send', 'timing', url, 'parse', parsingTime);

        if (response.error) {
          console.warn('ERROR networking error bad reqeust?', url);
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


  async get(config) {
    if (typeof config === 'string') {
      config = {
        url: config,
      };
    } else if (Object.keys(config).length > 3) {
      console.error('Nothing is supported except JSON GET requests with an option for caching in sw (and progress callback).', config);
    }


    if (!config.useCache) {
      return this.getFromInternet(config.url);
    }

    let url = config.url;

    // Add a key that tells the service worker whether the cache is up to date.
    let isKeyUpdated;
    if (config.useCache) {
      isKeyUpdated = this.isKeyUpdated(config.url);
      url = new URI(config.url).query({ loadFromCache: isKeyUpdated }).toString();
    }

    const internetValue = await this.getFromInternet(url, config, isKeyUpdated);

    if (config.useCache) {
      window.localStorage[LOCALSTORAGE_PREFIX + config.url] = Date.now();
    }


    return internetValue;
  }
}

export default new Request();
