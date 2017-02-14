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
		promises.push(mkdirp(path.join(PUBLIC_DIR, 'getTermDump', term.host)))
		promises.push(mkdirp(path.join(PUBLIC_DIR, 'getSearchIndex', term.host)))
	})

	await Promise.all(promises)


	promises = []

	terms.forEach(function (term) {

		var termDumpPromises = []

		var termDump = {
			classMap: {},
			sectionMap: {},
			subjectMap: {},
			termId: term.termId,
			host: term.host
		}

		termDumpPromises.push(fireRequest('/listClasses/' + term.host + '/' + term.termId, {}, "GET").then(function (response) {

			// Make a map of the hash to the classes
			response.forEach(function (aClass) {
				termDump.classMap[getHash(aClass)] = aClass;
			})
		}))


		termDumpPromises.push(fireRequest('/listSections/' + term.host + '/' + term.termId, {}, "GET").then(function (response) {

			// Make a map of the hash to the sections
			response.forEach(function (section) {
				termDump.sectionMap[getHash(section)] = section;
			})
		}))


		termDumpPromises.push(fireRequest('/listSubjects/' + term.host + '/' + term.termId, {}, "GET").then(function (response) {

			// Make a map of the hash to the subjects
			response.forEach(function (subject) {
				termDump.subjectMap[getHash(subject)] = subject;
			})
		}))


		promises.push(fireRequest('/getSearchIndex/' + term.host + '/' + term.termId, {}, "GET").then(function (response) {
			fs.writeFile(path.join(PUBLIC_DIR, 'getSearchIndex', term.host, term.termId), JSON.stringify(response))
		}))


		promises.push(Promise.all(termDumpPromises).then(function () {
			fs.writeFile(path.join(PUBLIC_DIR, 'getTermDump', term.host, term.termId), JSON.stringify(termDump))
		}))
	})




	await Promise.all(promises)
	console.log('All Done.')

}

main()
