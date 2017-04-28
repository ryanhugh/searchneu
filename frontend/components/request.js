import idb from 'idb-keyval';


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

  async waitForPromiseThenSave (internetPromise, url) {
    return;

    // let internetValue = await internetPromise.value


    var start = new Date().getTime();

    idb.set(url, ((await internetPromise).value))

    var end = new Date().getTime();

    console.log('Saving ',url,'took', (end-start),'ms')

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


    let idbValue = await this.getFromCache(config.url);

    if (idbValue) {

      // need to check to see if this is too old to use before showing to user

      const MS_PER_DAY = 86400000;
      // const MS_PER_DAY = 2;

      let now = new Date().getTime()

      const age = now - idbValue.timestamp

      console.log('File is ', age, 'ms old')

      // More than a day old, just get the latest version
      if (age < MS_PER_DAY) {
        return idbValue.value;
      }
    }


    let internetValue = await this.getFromInternet(config.url);

    setTimeout(function saveTimeout() {
        idb.set(config.url, {
          value: internetValue,
          timestamp: new Date().getTime()
        })
    }, 2000)

    return internetValue;
  }
}

export default new Request();
