import request from 'request-promise-native'

import macros from './macros'

// This object must be created once per process
// Attributes are added to this object when it is used
// This is the total number of requests per host
// https://github.com/request/request
// THE PLAN: use maxSockets instead of d3-queue, but use async.retry yea and just gut pointer.js from coursepro
var separateReqPool = {maxSockets: 10000, keepAlive: true, maxFreeSockets: 10000};


function main(config) {
	if (typeof config == 'string') {
		config = {
			method: 'GET',
			url: config
		}
	}

	var defaultConfig = {
		headers: {}
	}

	// Default to JSON for POST bodies
	if (config.method == 'POST') {
		defaultConfig.headers['Content-Type'] = 'application/json'
	}

	// Enable keep-alive to make sequential requests faster
	// config.forever = true
	defaultConfig.pool = separateReqPool

	//Ten min
	defaultConfig.timeout = 60 * 10000;

	defaultConfig.resolveWithFullResponse = true;

	// Allow fallback to old depreciated insecure SSL ciphers. Some school websites are really old  :/
    // We don't really care abouzt security (hence the rejectUnauthorized:false), and will accept anything. 
    // Additionally, this is needed when doing application layer dns caching because the url no longer matches the url in the cert
	defaultConfig.rejectUnauthorized = false
	defaultConfig.ciphers = 'ALL'

	// Set the host in the header to the hostname on the url.
	// This is not done automatically because of the application layer dns caching (it would be set to the ip instead)
	defaultConfig.headers.Host = urlParsed.hostname()


	//trololololol
	//Needed on some old sites that will redirect/block requests when this is not set
	//when a user is requesting a page that is not the entry page of the site
	//temple, etc
	defaultConfig.headers.Referer = config.url

	// Merge the objects
	Object.assign(config.headers, config.headers, defaultConfig.headers)
	Object.assign(config, config, defaultConfig)

	console.log(config)


	// return request(config)
}


// Helpers for get and post
main.get = function get(config) {
	if (typeof config == 'string') {
		return main({
			url: config,
			method: 'GET'
		})
	}
	else {
		config.method = 'GET'
		return main(config)
	}
}

main.post = function post(config) {
	if (typeof config == 'string') {
		return main({
			url: config,
			method: 'POST'
		})
	}
	else {
		config.method = 'POST'
		return main(config)
	}
}

main('http://httpbin.org/status/500').then(function(resp) {
	console.log('1', resp)
})
// main('https://google.com').then(function() {
// 	console.log('2', separateReqPool)

// })