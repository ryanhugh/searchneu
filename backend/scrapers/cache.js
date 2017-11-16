/*
 * This file is part of Search NEU and licensed under AGPL3. 
 * See the license file in the root folder for details. 
 */

import path from 'path';
import fs from 'fs-promise';
import mkdirp from 'mkdirp-promise';

import macros from '../macros';

var msgpack = require('msgpack5')() // namespace our extensions 


// Quick history of caching the http requests:
// The first attempt used a separate file for each request
// This caused around 98k files to end up in the folder for the classes
// Each file was stored as a the response to the http request.toJSON()
// Was cool because could load up some requests at a time without loading the entire cache.
// Problems:
// Sometimes got EMFILE issues on linux (can't open that many files at once)
// Windows explorer and other programs (ls) weren't happy with 98k files in one folder

// Take 2 was using dirty:
// https://github.com/felixge/node-dirty
// Slower than having each request in its own file (:O)

// Take 3, Use msgpack and just save to disk. 
// Unsure if msgpack can append to data that is already encoded. 
// Currently re-encoding everything and saving the entire db every so often
// Much faster than JSON, but not human readable (~x6 faster)

// If ever looking at changing the library used to back this,
// https://github.com/Level/levelup
// might be worth looking at

// Right now this is used to cache dev data and http requests to speed up development.

class Cache {

  constructor() {
    
    // Map of filepaths to a promise that resolves to the parsed body of this file
    this.dataPromiseMap = {}

    // Timeout for saving the file. Save file after 20 seconds with no set calls. 
    this.saveTimeoutMap = {};

    // Save the data every so often. If the process is killed while scraping, it will resume from the last save. 
    // This number is in milliseconds. 
    this.SAVE_INTERVAL_LONG = 12000

    // Used when optimize for speed is set to false. 
    this.SAVE_INTERVAL_SHORT = 10000

    this.totalTimeSpendEncoding = 0;
  }

  getFilePath(folderName, className) {
    return path.join('cache', folderName, className) + '.cache'
  }

  async loadFile(filePath) {
    if (this.dataPromiseMap[filePath]) {
      return;
    }

    await mkdirp(path.dirname(filePath))

    // Check to see if the msgpack file exists. 
    const msgPackFileExtension = filePath + '.msgpack';
    let exists = await fs.exists(msgPackFileExtension);
    if (exists) {
      const startTime = Date.now()
      const buffer = await fs.readFile(msgPackFileExtension)
      const midTime = Date.now()
      const retVal = msgpack.decode(buffer)
      console.log("It took ", Date.now() - midTime, 'ms to parse and ', midTime - startTime ,' to load ', msgPackFileExtension)
      return retVal;
    }

    // If it dosen't check to see if the json file exists
    const jsonFileExtension = filePath + '.json';
    exists = await fs.exists(jsonFileExtension);
    if (exists) {
      const startTime = Date.now()
      const buffer = await fs.readFile(jsonFileExtension)
      const midTime = Date.now()
      const retVal = JSON.parse(buffer)
      console.log("It took ", Date.now() - midTime, 'ms to parse and ', midTime - startTime ,' to load ', jsonFileExtension)
      return retVal;
    }

    return {};
  }



  async ensureLoaded(filePath) {
    if (this.dataPromiseMap[filePath]) {
      return;
    }

    let promise = this.loadFile(filePath)
    this.dataPromiseMap[filePath] = promise
    return promise;
  }


  // Path, in both set and get, is an array of strings. These strings can be anything and can be the same for separate requests, but just need to be the same for identical requests. 
  // Kindof like hash codes in java for the equals method.
  async get(folderName, className, key) {
    if (!macros.DEV) {
      macros.error("Called cache.js get but not in DEV mode?");
    }

    // Foldername can be either requests or dev_data
    // if (folderName !== 'requests' && folderName !== 'dev_data' ) {
    //  macros.critical('Invalid folderName for cache', folderName);
    //  return null;
    // }

    // We could also just use it for just requests and not dev_data, but eh maybe later.


    const filePath = this.getFilePath(folderName, className);

    // Make sure the cache exists and is loaded.
    this.ensureLoaded(filePath);

    let dataMap = await this.dataPromiseMap[filePath]

    return dataMap[key];

  }

  async save(filePath, optimizeForSpeed) {

    let dataMap = await this.dataPromiseMap[filePath]
    let startTime = Date.now();
    
    let buffer;
    let destinationFile = filePath;

    if (optimizeForSpeed) {
      buffer = msgpack.encode(dataMap)
      destinationFile += '.msgpack'
    }
    else {

      // Prettify the JSON when stringifying
      buffer = JSON.stringify(dataMap, null, 4)
      destinationFile += '.json'
    }

    const timeSpendEncoding = Date.now() - startTime;
    this.totalTimeSpendEncoding += timeSpendEncoding
    console.log("Saving file", destinationFile, 'encoding took', timeSpendEncoding, this.totalTimeSpendEncoding)
    await fs.writeFile(destinationFile + '.new', buffer)

    // Write to a file with a different name, and then rename the new one. Renaming a file to a filename that already exists
    // will override the old file in node.js. 
    // This prevents the cache file from getting into an invalid state if the process is killed while the program is saving.
    // If the file does not exist, ignore the error
    await fs.rename(destinationFile + '.new', destinationFile)
    console.log("It took ", Date.now() - startTime, 'ms to save', destinationFile)
  }


  // Returns a promsie when it is done.
  // The optimize for speed option:
  //     If set to false, the data is debuffed at 10 seconds and saved as JSON. 
  //    This is meant for files that don't save very much data and it would be nice to be able to easily read the cache.
  //     If set to true, the data is debuffed at 120 seconds and saved with msgpack.
  //      This is much faster than JSON, but is binary (not openable by editors easily).
  async set(folderName, className, key, value, optimizeForSpeed = false) {
    if (!macros.DEV) {
      macros.error("Called cache.js set but not in DEV mode?");
    }

    const filePath = this.getFilePath(folderName, className);

    this.ensureLoaded(filePath);


    let dataMap = await this.dataPromiseMap[filePath]

    dataMap[key] = value;

    let intervalTime;
    if (optimizeForSpeed) {
      intervalTime = this.SAVE_INTERVAL_LONG
    }
    else {
      intervalTime = this.SAVE_INTERVAL_SHORT
    }

    // Wait 10 seconds before saving. 
    if (!this.saveTimeoutMap[filePath]) {
      this.saveTimeoutMap[filePath] = setTimeout(async () => {
        await this.save(filePath, optimizeForSpeed);
        this.saveTimeoutMap[filePath] = null;
      }, intervalTime)
    }
  }
}


let a = new Cache()



// console.log(a.get('requests_new2','camd.northeastern.edu',''))

// a.dataPromiseMap['cache/requests_new2/camd.northeastern.edu.cache'].then(function(a) {
//  console.log(Object.keys(a))
// })





export default a;