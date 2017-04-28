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


    let internetPromise = this.getFromInternet(config.url).then(function(value) {
      return {
        type: 'internet',
        value: value
      }
    })

    let idbPromise = this.getFromCache(config.url).then(function(value) {
      return {
        type: 'idb',
        value: value
      }
    })


    let firstResult = await Promise.race([internetPromise, idbPromise])

    // The expected result
    if (firstResult.type === 'idb') {
      if (firstResult.value) {

        // Wait for the internet value and store it in the cache
        // this.waitForPromiseThenSave(internetPromise, config.url);

        console.log('returning', firstResult.value)
        return firstResult.value;
      }
      else {

        let internetValue = await internetPromise;
        idb.set(config.url, internetValue.value);
        return internetValue.value;
      }
    }
    else if (firstResult.type === 'internet') {
      console.log('Internet was faster than idb?')

      // Store value in idb, but don't wait for it to save before returning
      idb.set(config.url, firstResult.value);

      return firstResult.value;

    }
    else {
      console.error('ERROR?')
    }
  }
}

export default new Request();
