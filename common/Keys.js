/*
 * This file is part of Search NEU and licensed under AGPL3. 
 * See the license file in the root folder for details. 
 */

// This file is used to manage the {host:, termId: subject:...} objects used to get more data. 
// This is used in both the backend and the frontend.
// So anything that is required is is added many different places. 
import macros from './commonMacros'


// feature request from server.js: add classId if not given classUid and given host+termId+subject
// addClassUids. could also benefit from this feature. 

// Copied from lodash source to avoid depending on it here. It wound't be that bad if is needed though. 
function startsWith(string, target) {
	return string.slice(0, target.length) == target;
}


var endpoints = []
var minData = 2;

function Keys(obj, endpoint, config) {
	if (obj instanceof Keys || !obj || (obj._id && !obj.hash && !obj.host) || (obj.isString && !config.stringAllowed)) {
		macros.error('welp', obj)
	}

	if (endpoint) {
		this.endpoint = endpoint
	}


	// Get string off object if creating with string
	if (obj.desc && obj.host && config.stringAllowed) {
		this.host = obj.host
		this.desc = obj.desc
		this.isString = true
	}

	// Prefer obj over hash
	else if (obj.host) {
		var endpointIndex;
		if (endpoint) {
			endpointIndex = endpoints.indexOf(endpoint)
		}
		var hasAllKeys = true;
		var i;
		for (i = 0; i < Keys.allKeys.length; i++) {
			var currValue = obj[Keys.allKeys[i]];
			if (!currValue) {
				break
			}
			else if (endpointIndex && i > endpointIndex) {
				hasAllKeys = false;
				macros.error(obj, endpoint)
				break;
			}
			else {
				this[Keys.allKeys[i]] = currValue;
			}
		}

		i++;
		for (; i < Keys.allKeys.length; i++) {
			if (obj[Keys.allKeys[i]]) {

				// Shouldn't have any keys after first one that isn't present
				macros.error(obj, endpoint)
			}
		}

		if (!obj.subject) {
			if (obj.host && obj.termId && obj.hash) {
		
				if (startsWith(obj.hash, '/list') || startsWith(obj.hash, '/') || !config.hashAllowed) {
					macros.error(obj, endpoint, config.hashAllowed)
				}
				else {
					
					// this hash shall be "neu.edu/201710/..."
					// A obj hash SHOULD NOT START WITH /LISTsomething
					// the api endpoint is added below
					this.hash = obj.hash
					hasAllKeys = true;
					
				}
				
			}
		}
		if (!hasAllKeys) {
			macros.error('dont have all keys',obj, endpoint)
		}
		
		
	}

	else if (endpoint !== undefined && endpoint !== macros.LIST_COLLEGES) {
		macros.error(obj, endpoint);
	}
}

Keys.create = function (obj, endpoint) {
	if (arguments.length > 1) {
		console.trace('ERROR!', obj, endpoint, config)
		console.error('Keys called with endpoint, but endpoints not supported anymore.')
	}
	return new this(obj, endpoint, {});
};

Keys.createWithHash = function (obj, endpoint) {
	console.trace('ERROR!', obj, endpoint, config)
	console.error('Keys called with endpoint, but endpoints not supported anymore.')
	return new this(obj, endpoint, {
		hashAllowed: true
	});
};

Keys.createWithString = function (obj) {
	console.trace('ERROR!', obj, endpoint, config)
	console.error('Keys called with endpoint, but endpoints not supported anymore.')
	return new this(obj, null, {
		stringAllowed: true
	})
}


Keys.allKeys = ['host', 'termId', 'subject', 'classUid', 'crn']
Keys.replacementRegex = /[^A-Za-z0-9.]+/g

// Keys.prototype.createWithClassId = function (obj, endpoint) {
// 	return new this(obj, endpoint, {
// 		classId: true
// 	})
// };

// returns neu.edu/201710/CS/4800_4444444/1234, etc
Keys.prototype.getHash = function () {
	if (this.isString) {
		if (!this.host || !this.desc) {
			macros.error()
			return null;
		}
		else {
			return this.host + '/' + this.desc.replace(Keys.replacementRegex, "_")
		}
	}
	if (this.hash) {
		if (startsWith(this.hash, '/list')) {
			macros.error()
		}
		return this.hash
	}
	var key = [];

	// create the key
	for (var i = 0; i < Keys.allKeys.length; i++) {
		if (!this[Keys.allKeys[i]]) {
			break
		}
		key.push(this[Keys.allKeys[i]].replace(Keys.replacementRegex, "_"));
	}
	if (key.length > 0) {
		return key.join('/')
	}
	else {
		// Possible if looking up all hosts
		return '';
	}
};

Keys.prototype.getHashWithEndpoint = function (endpoint) {
	if (this.isString) {
		macros.error()
		return null;
	}
	return endpoint + '/' + this.getHash()
};

// Used in BaseData to go from a class that has everything to the classUid to what should be requested from the server
Keys.prototype.getMinimumKeys = function () {
	if (this.isString) {
		macros.error()
		return null;
	}
	var retVal = {};
	for (var i = 0; i < minData; i++) {
		var currValue = this[Keys.allKeys[i]];
		if (!currValue) {
			// macros.error()
			break;
		}
		retVal[Keys.allKeys[i]] = currValue
	}
	return Keys.create(retVal);
};


Keys.prototype.getObj = function () {
	if (this.isString) {
		return {
			isString: true,
			desc: this.desc
		}
	}
	if (this.hash) {
		// Can't get obj if given hash
		macros.error()
		return {
			hash: this.hash
		}
	}
	else {

		var retVal = {};

		for (var i = 0; i < Keys.allKeys.length; i++) {
			var currValue = this[Keys.allKeys[i]];
			if (!currValue) {
				break;
			}
			retVal[Keys.allKeys[i]] = currValue;
		}
		return retVal;
	}
};


Keys.prototype.containsAllProperties = function (arr) {
	if (this.isString) {
		return false;
	}
	for (var i = 0; i < arr.length; i++) {
		if (!this[arr[i]]) {
			return false
		}
	}
	return true;
};


// Ensure that have minimum data required to create an instance or lookup by something
// This is one prop than need to lookup one row
// eg. for subject this requrest host and termId
Keys.prototype.isValid = function (endpoint) {
	if (this.isString) {
		return false
	}
	if (!endpoint) {
		if (this.endpoint) {
			endpoint = this.endpoint
		}
		else {
			// Need an endpoint from somewhere to check if this is valid
			macros.error()
			return false
		}
	}

	var endpointIndex = endpoints.indexOf(endpoint);

	for (var i = 0; i < endpointIndex; i++) {
		if (!this[Keys.allKeys[i]]) {
			return false;
		}
	}

	i++;
	for (; i < Keys.allKeys.length; i++) {
		if (this[Keys.allKeys[i]]) {
			return false
		}
	}
	return true;
};

Keys.prototype.equals = function (other) {
	if (!(other instanceof Keys)) {
		return false
	}
	return this.propsEqual(other);
};

// Same as equals but dosen't do an instance check
// so can be used to compare to a row or and instance of Class or something
Keys.prototype.propsEqual = function (other) {
	if (this.isString && other.isString) {
		return this.desc === other.desc
	}
	else if (this.isString || other.isString) {
		return false;
	}
	if (this.hash) {
		if (this.hash === other.hash) {
			return true;
		}
		// else if (other.host) {
		// 	macros.error()
		// }
		return false;
	}
	else {

		for (var i = 0; i < Keys.allKeys.length; i++) {
			var propName = Keys.allKeys[i];

			//When reached the end, done
			if (this[propName] === undefined) {
				return true;
			}
			if (this[propName] !== other[propName]) {
				return false;
			}
		}
		return true;
	}
};






// create with obj or hash or _id (make sure in order and not missing any)
// func where give array ('host','termId') and it checks if you have all of them
// func that returns hash (regex to replace (and something else?))
// equals (instanceof check)
// propsEqual (no instance of check)


// endpoint string here
// -- grab from dump database, server, all the datas, and ctrl f frontend backend


module.exports = Keys
