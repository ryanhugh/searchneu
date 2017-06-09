import path from 'path';
import dirty from 'dirty';

import utils from './utils';



class Cache {

	constructor() {
		
		// Map of loaded dirty objects to 
		this.dirtyMap = {}


	}

	getFilePath(folderName, className) {
		return path.join('cache', folderName, className) + '.cache'
	}

	ensureLoaded(filePath) {
		if (this.dirtyMap[filePath]) {
			return;
		}

		let startTime = Date.now()

		this.dirtyMap[filePath] = dirty(filePath)

		return new Promise((resolve, reject) => {
			this.dirtyMap[filePath].on('load', function() {
				console.log("It took ", Date.now() - startTime, 'ms to load', filePath)

				resolve()
			})
		})
	}


	// Path, in both set and get, is an array of strings. These strings can be anything and can be the same for separate requests, but just need to be the same for identical requests. 
	// Kindof like hash codes in java for the equals method.
	async get(folderName, className, key) {

		// Foldername can be either requests or dev_data
		if (folderName !== 'requests' && folderName !== 'dev_data' ) {
			utils.critical('Invalid folderName for cache', folderName);
			return null;
		}

		// Use dirty for everything now.
		// We could also just use it for just requests and not dev_data, but eh maybe later.


		const filePath = this.getFilePath(folderName, className);

		// Make sure the cache exists and is loaded.
		await ensureLoaded(filePath);

		return this.dirtyMap[filePath].get(key)

	}


	// Returns a promsie when it is done.
	async set(folderName, className, key, value) {


		const filePath = this.getFilePath(folderName, className);

		await ensureLoaded(filePath);

		// This function also takes a 3rd argument which is a callback.
		// Don't wait for it to save to disk before continuing
		return this.dirtyMap[filePath].set(key, value)
	}




}

let a = new Cache()

// console.log(a.getFilePath(['jflkFFFFF^&*^&*^&****sj','jj']))

export default a;