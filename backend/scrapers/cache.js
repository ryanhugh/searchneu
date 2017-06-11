import path from 'path';
import fs from 'fs-promise';
import mkdirp from 'mkdirp-promise';

import utils from './utils';

var msgpack = require('msgpack5')() // namespace our extensions 


class Cache {

	constructor() {
		
		// Map of filepaths to dirty object promises 
		this.dataPromiseMap = {}

		// Timeout for saving the file. Save file after 20 seconds with no set calls. 
		this.saveTimeoutMap = {};

		// How long to wait after the most recent set call to save the data. 
		this.SAVE_DEBOUNCE = 10000
	}

	getFilePath(folderName, className) {
		return path.join('cache', folderName, className) + '.cache'
	}

	async loadFile(filePath) {
		if (this.dataPromiseMap[filePath]) {
			return;
		}

		await mkdirp(path.dirname(filePath))

		let exists = await fs.exists(filePath);
		let retVal;
		if (exists) {
			let startTime = Date.now()
			let buffer = await fs.readFile(filePath)
			retVal = msgpack.decode(buffer)
			console.log("It took ", Date.now() - startTime, 'ms to load', filePath)
		}
		else {
			retVal = {}
		}
		
		return retVal;
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

		// Foldername can be either requests or dev_data
		// if (folderName !== 'requests' && folderName !== 'dev_data' ) {
		// 	utils.critical('Invalid folderName for cache', folderName);
		// 	return null;
		// }

		// We could also just use it for just requests and not dev_data, but eh maybe later.


		const filePath = this.getFilePath(folderName, className);

		// Make sure the cache exists and is loaded.
		this.ensureLoaded(filePath);

		let dataMap = await this.dataPromiseMap[filePath]

		return dataMap[key];

	}

	async save(filePath) {

		let dataMap = await this.dataPromiseMap[filePath]
		let startTime = Date.now();
		let buffer = msgpack.encode(dataMap)
		await fs.writeFile(filePath + '.new', buffer)

		// Write to a file with a different name, and then delete the old and rename the new.
		// This prevents the cache file from getting into an invalid state if the process is killed while the program is saving.
		await fs.unlink(filePath);
		await fs.rename(filePath + '.new', filePath)
		console.log("It took ", Date.now() - startTime, 'ms to save', filePath)
	}


	// Returns a promsie when it is done.
	async set(folderName, className, key, value) {


		const filePath = this.getFilePath(folderName, className);

		this.ensureLoaded(filePath);


		let dataMap = await this.dataPromiseMap[filePath]

		dataMap[key] = value;

		// Wait 10 seconds before saving. 
		if (!this.saveTimeoutMap[filePath]) {
			this.saveTimeoutMap[filePath] = setTimeout(() => {
				this.save(filePath);
				this.saveTimeoutMap[filePath] = null;
			}, this.SAVE_DEBOUNCE)
		}
	}
}


let a = new Cache()



// console.log(a.get('requests_new2','camd.northeastern.edu',''))

// a.dataPromiseMap['cache/requests_new2/camd.northeastern.edu.cache'].then(function(a) {
// 	console.log(Object.keys(a))
// })





export default a;