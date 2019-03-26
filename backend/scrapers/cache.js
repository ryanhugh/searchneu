/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import path from 'path';
import fs from 'fs-extra';
import mkdirp from 'mkdirp-promise';
import msgpackImport from 'msgpack5';
import _ from 'lodash';

import macros from '../macros';

const msgpack = msgpackImport();


// This file is responsible for caching things during development mode
// It doesn't run at all in production or testing
// It works just like a key-value store,
// they key is just split into three parts - folder, filename, and keyname
// It saves a different hash map to disk at each folder/filename combo (eg searchneu/cache/dev_data/EllucianCatalogParser.cache.msgpack).
// Each key in the hash map maps to the value passed in the set method.
// This is used in two places in the codebase: to cache HTTP requests for the scrapers, and the output from each parser
// When an HTTP request in the scrapers is made in development, its response is cached to disk with this file
// This way, while developing the code when you make another request, it will load from disk instead of the net (much faster)
// The data will be outdated, but that doesn't matter for dev.

// When this is called from the requests the folder is set to macros.REQUESTS_CACHE_DIR
// and when it is called from the parsers it is set to macros.DEV_DATA_DIR.

// If we want to ever make this better in the future, we could add a feature to append to an existing json/msgpack buffer
// instead of decoding and re-encoding the entire buffer over again every time we save.


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
    this.dataPromiseMap = {};

    // Timeout for saving the file. Save file after 20 seconds with no set calls.
    this.saveTimeoutMap = {};

    // Save the data every so often. If the process is killed while scraping, it will resume from the last save.
    // This number is in milliseconds.
    this.SAVE_INTERVAL_LONG = 120000;

    // Used when optimize for speed is set to false.
    this.SAVE_INTERVAL_SHORT = 60000;

    this.totalTimeSpendEncoding = 0;

    this.totalTimeSpendCloning = 0;
  }

  getFilePath(folderName, className) {
    return `${path.join('cache', folderName, className)}.cache`;
  }

  // Ensures that the folder name is one of the two currently used folder names
  // More can be added later, just change this method to allow them
  verifyFolderName(name) {
    if (name !== macros.DEV_DATA_DIR || name !== macros.REQUESTS_CACHE_DIR) {
      macros.critical('Folder name must be macros.DEV_DATA_DIR (for parsers cache) or macros.REQUESTS_CACHE_DIR (for request cache)');
    }
  }

  async loadFile(filePath) {
    if (this.dataPromiseMap[filePath]) {
      return undefined;
    }

    await mkdirp(path.dirname(filePath));

    // Check to see if the msgpack file exists.
    const msgPackFileExtension = `${filePath}.msgpack`;
    let exists = await fs.exists(msgPackFileExtension);
    if (exists) {
      const startTime = Date.now();
      const buffer = await fs.readFile(msgPackFileExtension);
      const midTime = Date.now();
      const retVal = msgpack.decode(buffer);
      macros.log('It took ', Date.now() - midTime, 'ms to parse and ', midTime - startTime, ' to load ', msgPackFileExtension);
      return retVal;
    }

    // If it dosen't check to see if the json file exists
    const jsonFileExtension = `${filePath}.json`;
    exists = await fs.exists(jsonFileExtension);
    if (exists) {
      const startTime = Date.now();
      const buffer = await fs.readFile(jsonFileExtension);
      const midTime = Date.now();
      const retVal = JSON.parse(buffer);
      macros.log('It took ', Date.now() - midTime, 'ms to parse and ', midTime - startTime, ' to load ', jsonFileExtension);
      return retVal;
    }

    return {};
  }


  async ensureLoaded(filePath) {
    if (this.dataPromiseMap[filePath]) {
      return undefined;
    }

    const promise = this.loadFile(filePath);
    this.dataPromiseMap[filePath] = promise;
    return promise;
  }


  // Path, in both set and get, is an array of strings. These strings can be anything and can be the same for separate requests, but just need to be the same for identical requests.
  // Kindof like hash codes in java for the equals method.
  async get(folderName, className, key) {
    if (!macros.DEV) {
      macros.error('Called cache.js get but not in DEV mode?');
    }

    this.verifyFolderName(folderName);

    const filePath = this.getFilePath(folderName, className);

    // Make sure the cache exists and is loaded.
    this.ensureLoaded(filePath);

    const dataMap = await this.dataPromiseMap[filePath];

    return dataMap[key];
  }

  async save(filePath, optimizeForSpeed) {
    const dataMap = await this.dataPromiseMap[filePath];
    const startTime = Date.now();

    let buffer;
    let destinationFile = filePath;

    if (optimizeForSpeed) {
      buffer = msgpack.encode(dataMap);
      destinationFile += '.msgpack';
    } else {
      // Prettify the JSON when stringifying
      buffer = JSON.stringify(dataMap, null, 4);
      destinationFile += '.json';
    }

    const timeSpendEncoding = Date.now() - startTime;
    this.totalTimeSpendEncoding += timeSpendEncoding;
    macros.log('Saving file', destinationFile, 'encoding took', timeSpendEncoding, this.totalTimeSpendEncoding);
    await fs.writeFile(`${destinationFile}.new`, buffer);

    // Write to a file with a different name, and then rename the new one. Renaming a file to a filename that already exists
    // will override the old file in node.js.
    // This prevents the cache file from getting into an invalid state if the process is killed while the program is saving.
    // If the file does not exist, ignore the error
    await fs.rename(`${destinationFile}.new`, destinationFile);
    macros.log('It took ', Date.now() - startTime, 'ms to save', destinationFile, `(${this.totalTimeSpendCloning}ms spent cloning so far).`);
  }


  // Returns a promsie when it is done.
  // The optimize for speed option:
  //     If set to false, the data is debounced at SAVE_INTERVAL_SHORT (60 as of now) seconds and saved as JSON.
  //    This is meant for files that don't save very much data and it would be nice to be able to easily read the cache.
  //     If set to true, the data is debounced at SAVE_INTERVAL_LONG (120 as of now) seconds and saved with msgpack.
  //      This is much faster than JSON, but is binary (not openable by editors easily).
  async set(folderName, className, key, value, optimizeForSpeed = false) {
    if (!macros.DEV) {
      macros.error('Called cache.js set but not in DEV mode?');
    }

    this.verifyFolderName(folderName);

    const filePath = this.getFilePath(folderName, className);

    this.ensureLoaded(filePath);


    const dataMap = await this.dataPromiseMap[filePath];

    // Clone the object so that the object that is going to be saved now is modified before the file is saved,
    // the value that was given to this function is saved and not some other value
    if (!optimizeForSpeed) {
      const startTime = Date.now();
      value = _.cloneDeep(value);
      this.totalTimeSpendCloning += Date.now() - startTime;
    }

    dataMap[key] = value;

    let intervalTime;
    if (optimizeForSpeed) {
      intervalTime = this.SAVE_INTERVAL_LONG;
    } else {
      intervalTime = this.SAVE_INTERVAL_SHORT;
    }

    // Start a timeout and save when the timeout fires.
    if (!this.saveTimeoutMap[filePath]) {
      this.saveTimeoutMap[filePath] = setTimeout(async () => {
        await this.save(filePath, optimizeForSpeed);
        this.saveTimeoutMap[filePath] = null;
      }, intervalTime);
    }
  }
}


export default new Cache();
