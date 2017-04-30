import URI from 'urijs';


const LOCALSTORAGE_PREFIX = 'request_cache';
const MS_PER_DAY = 86400000;

class Request {

  isKeyUpdated(key) {
    const storedValue = window.localStorage[LOCALSTORAGE_PREFIX + key];

    if (!storedValue) {
      return false;
    }

    const now = new Date().getTime();

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


  async getFromInternet(url, config) {
    return new Promise((resolve, reject) => {
      const xmlhttp = new XMLHttpRequest();
      xmlhttp.onreadystatechange = function onreadystatechange() {
        if (xmlhttp.readyState !== 4) {
          return;
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

        const startParse = new Date().getTime();
        const response = JSON.parse(xmlhttp.response);
        const endParse = new Date().getTime();
        console.log('Parsing took ', (endParse - startParse), 'for url', url);

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
    if (config.useCache) {
      const isKeyUpdated = this.isKeyUpdated(config.url);
      url = new URI(config.url).query({ loadFromCache: isKeyUpdated }).toString();
    }

    const internetValue = await this.getFromInternet(url, config);

    if (config.useCache) {
      window.localStorage[LOCALSTORAGE_PREFIX + config.url] = new Date().getTime();
    }


    return internetValue;
  }
}

export default new Request();
