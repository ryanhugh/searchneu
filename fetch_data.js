import path from 'path'
import fs from 'mz/fs'
import mkdirp from 'mkdirp-promise'
import request from 'request-promise-native'

const PUBLIC_DIR = 'compiled_frontend'


async function fireRequest(url, body = {}, method = "POST") {
	console.log(url, method)

	url = 'https://coursepro.io' + url

	var options = {
		method: method,
		headers: {
			'user-agent': "hi there"
		},
		json: true,
		url: url
	}

	if (method == 'POST') {
		options.body = body;
	}

	return await request(options)
}

//TODO: this needs to be a Key.js not this ghetto thing
function getHash(obj) {
	var keys = ['host', 'termId', 'subject', 'classUid', 'crn']
	var retVal = [];
	keys.forEach(function (key) {
		if (!obj[key]) {
			return;
		}
		retVal.push(obj[key].replace('/', '_'))
	})
	return retVal.join('/')
}


async function main() {

	var hosts = await fireRequest('/listColleges')

	console.log(hosts)
	var promises = [];

	hosts.forEach(function (host) {
		promises.push(fireRequest('/listTerms', {
			host: host.host.replace('/', '_')
		}))
	})

	var terms = await Promise.all(promises)

	terms = [].concat(...terms)

	promises = []

	terms.forEach(function (term) {
		promises.push(mkdirp(path.join(PUBLIC_DIR, 'getClassesMap', term.host)))
		promises.push(mkdirp(path.join(PUBLIC_DIR, 'getSectionMap', term.host)))
		promises.push(mkdirp(path.join(PUBLIC_DIR, 'getSearchIndex', term.host)))
	})

	await Promise.all(promises)


	promises = []

	terms.forEach(function (term) {


		promises.push(fireRequest('/listClasses/' + term.host + '/' + term.termId, {}, "GET").then(function (response) {

			// Make a map of the hash to the classes
			var classMap = {}
			response.forEach(function (aClass) {
				classMap[getHash(aClass)] = aClass;
			})

			fs.writeFile(path.join(PUBLIC_DIR, 'getClassesMap', term.host, term.termId), JSON.stringify(classMap))
		}))


		promises.push(fireRequest('/listSections/' + term.host + '/' + term.termId, {}, "GET").then(function (response) {

			// Make a map of the hash to the sections
			var sectionMap = {}
			response.forEach(function (section) {
				sectionMap[getHash(section)] = section;
			})

			fs.writeFile(path.join(PUBLIC_DIR, 'getSectionMap', term.host, term.termId), JSON.stringify(sectionMap))
		}))


		promises.push(fireRequest('/getSearchIndex/' + term.host + '/' + term.termId, {}, "GET").then(function (response) {
			fs.writeFile(path.join(PUBLIC_DIR, 'getSearchIndex', term.host, term.termId), JSON.stringify(response))
		}))


	})


	await Promise.all(promises)
	console.log('All Done.')

}

main()
