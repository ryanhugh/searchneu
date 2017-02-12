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


async function main() {

	var hosts = await fireRequest('/listColleges')

	console.log(hosts)
	var promises = [];

	hosts.forEach(function (host) {
		promises.push(fireRequest('/listTerms', {
			host: host.host
		}))
	})

	var terms = await Promise.all(promises)

	terms = [].concat(...terms)

	promises = []

	terms.forEach(function (term) {
		promises.push(mkdirp(path.join(PUBLIC_DIR, 'listClasses', term.host)))
		promises.push(mkdirp(path.join(PUBLIC_DIR, 'listSections', term.host)))
		promises.push(mkdirp(path.join(PUBLIC_DIR, 'getSearchIndex', term.host)))
	})

	await Promise.all(promises)


	promises = []

	terms.forEach(function (term) {


		promises.push(fireRequest('/listClasses/' + term.host + '/' + term.termId, {}, "GET").then(function (response) {
			fs.writeFile(path.join(PUBLIC_DIR, 'listClasses', term.host, term.termId), JSON.stringify(response))
		}))


		promises.push(fireRequest('/listSections/' + term.host + '/' + term.termId, {}, "GET").then(function (response) {
			fs.writeFile(path.join(PUBLIC_DIR, 'listSections', term.host, term.termId), JSON.stringify(response))
		}))


		promises.push(fireRequest('/getSearchIndex/' + term.host + '/' + term.termId, {}, "GET").then(function (response) {
			fs.writeFile(path.join(PUBLIC_DIR, 'getSearchIndex', term.host, term.termId), JSON.stringify(response))
		}))


	})


	await Promise.all(promises)
	console.log('All Done.')

}

main()
