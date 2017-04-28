import idb from 'idb-keyval';


const LOCALSTORAGE_PREFIX = 'request_cache'
const MS_PER_DAY = 86400000;

class Request {



  async getFromCache(url) {

    var start = new Date().getTime();

    let existingValue = await idb.get(url)

    var end = new Date().getTime();

    if (existingValue) {
      console.log('Lookup for',url,'found ',existingValue.length,'in', (end - start),'ms');      
    }
    else {
      console.log('Lookup for',url,'not found in', (end - start),'ms');       
    }

    return existingValue;
  }

  async saveToCache (url, value) {

    var start = new Date().getTime();

    let existingValue = await idb.set(url, value)

    var end = new Date().getTime();

    console.log('Saving took', (end-start), 'ms')
    window.localStorage[LOCALSTORAGE_PREFIX + url] = new Date().getTime();
  }


  isKeyUpdated(key) {
    const storedValue = window.localStorage[LOCALSTORAGE_PREFIX + key]

    if (!storedValue) {
      return false;
    }

    let now = new Date().getTime()

    if (now - parseInt(storedValue) > MS_PER_DAY) {
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


  async getFromInternet(url) {
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

        const response = JSON.parse(xmlhttp.response);

        if (response.error) {
          console.warn('ERROR networking error bad reqeust?', url);
        }

        resolve(response);
      };


      xmlhttp.open('GET', url, true);
      xmlhttp.send();
    });
  }


  async get(config) {
    if (typeof config === 'string') {
      config = {
        url: config,
      };
    }
    else if (Object.keys(config).length > 2) {
      console.error('Nothing is supported except JSON GET requests with an option for caching in idb.', config);
    }


    if (!config.useCache) {
      return this.getFromInternet(config.url)
    }


    if (this.isKeyUpdated(config.url)) {
      return this.getFromCache(config.url);
    }
    else {
      let internetValue = await this.getFromInternet(config.url);

      setTimeout(() => {
        this.saveToCache(config.url, internetValue)
      }, 2000)

      return internetValue;
    }


  }
}

export default new Request();
