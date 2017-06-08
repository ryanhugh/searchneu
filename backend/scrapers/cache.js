import path from 'path';
import dirty from 'dirty';

import utils from './utils';



class Cache {

	constructor() {
		
		// Map of loaded dirty objects to 
		this.dirtyMap = {}


	}

	getFilePath(cachePath) {

		// Strip out all non alphanumeric characters and .toLowerCase() everything. Needs to work on windows and mac.
		// It is possible to do this without a regex, might switch it in the future. 

		for (var i = 0; i < cachePath.length; i++) {
			cachePath[i] = cachePath[i].slice(0, 25).replace(/\W/g, '').toLowerCase();
		}


		return path.join(...cachePath) + '.cache'
	}

	ensureLoaded(filePath) {
		if (this.dirtyMap[filePath]) {
			return;
		}

		this.dirtyMap[filePath] = dirty(filePath)

		return new Promise((resolve, reject) => {
			this.dirtyMap[filePath].on('load', function() {
				resolve()
			})
		})
	}


	// Path, in both set and get, is an array of strings. These strings can be anything and can be the same for separate requests, but just need to be the same for identical requests. 
	// Kindof like hash codes in java for the equals method.
	get(cachePath) {


		// The last item in the cachePath is the name of the dirty index.
		// All the prior ones are the folder names
		if (cachePath.length === 0) {
			utils.critical('Invalid key for cache.js', cachePath)
			return null;
		}

		let cacheName = this.getFilePath(cachePath);

		// Make sure the cache exists and is loaded.
		await ensureLoaded(cacheName);


		this.dirtyMap[filePath].get()


	}



	set(cachePath, value) {

	}

}

let a = new Cache()

console.log(a.getFilePath(['jflkFFFFF^&*^&*^&****sj','jj']))

export default a;