var request = require('request')
var htmlparser = require('htmlparser2');
var domutils = require('domutils');
var _ = require('lodash')
var elasticlunr = require('elasticlunr')
var fs = require('fs-promise');
var async = require('async')
var cookie = require('cookie')
var retry = require('promise-retry')
import mkdirp from 'mkdirp-promise'
import path from 'path'

var alphabet = 'aqwertyuiopsdfghjklzxcvbnm';

function handleRequestResponce(body, callback) {
	var handler = new htmlparser.DomHandler(callback);
	var parser = new htmlparser.Parser(handler);
	parser.write(body);
	parser.done();
};



//returns a {colName:[values]} where colname is the first in the column
//regardless if its part of the header or the first row of the body
function parseTable(table) {
	if (table.name != 'table') {
		console.warn('parse table was not given a table..')
		return;
	};

	//includes both header rows and body rows
	var rows = domutils.getElementsByTagName('tr', table);

	if (rows.length === 0) {
		return;
	};


	var retVal = {
		_rowCount: rows.length - 1
	}
	var heads = []

	//the headers
	rows[0].children.forEach(function (element) {
		if (element.type != 'tag' || ['th', 'td'].indexOf(element.name) === -1) {
			return;
		}

		var text = domutils.getText(element).trim().toLowerCase().replace(/\s/gi, '');
		retVal[text] = []
		heads.push(text);

	}.bind(this));



	//add the other rows
	rows.slice(1).forEach(function (row) {

		var index = 0;
		row.children.forEach(function (element) {
			if (element.type != 'tag' || ['th', 'td'].indexOf(element.name) === -1) {
				return;
			}
			if (index >= heads.length) {
				console.log('warning, table row is longer than head, ignoring content', index, heads, rows);
				return;
			};

			retVal[heads[index]].push(domutils.getText(element).trim())

			//only count valid elements, not all row.children
			index++;
		}.bind(this));


		//add empty strings until reached heads length
		for (; index < heads.length; index++) {
			retVal[heads[index]].push('')
		};


	}.bind(this));
	return retVal;
};

var people = []
var peopleMap = {}

var index = elasticlunr();
index.saveDocument(false)

index.setRef('id');
index.addField('name');
index.addField('phone');
index.addField('email');
index.addField('primaryappointment');
index.addField('primarydepartment');


var getCookie = async.memoize(function _getCookie(callback) {

	request({
		url: 'https://prod-web.neu.edu/wasapp/employeelookup/public/main.action',
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143',
		}
	}, function (err, resp, body) {
		if (err) {
			return callback(err)
		}

		var cookieString = resp.headers['set-cookie'][0];
		var cookies = cookie.parse(cookieString);
		callback(null, cookies.JSESSIONID)
	}.bind(this))
})


function hitWithLetters(lastNameStart, cookie) {

	return retry({
		factor: 1,
		maxTimeout: 5000
	}, function (retry, num) {
		return new Promise(function (resolve, reject) {
			var body = 'searchBy=Last+Name&queryType=begins+with&searchText=' + lastNameStart + '&deptText=&addrText=&numText=&divText=&facStaff=1'
			request({
				url: 'https://prod-web.neu.edu/wasapp/employeelookup/public/searchEmployees.action',
				method: 'POST',
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143',
					'Content-Type': 'application/x-www-form-urlencoded',
					'Cookie': 'JSESSIONID=' + cookie,
					'Referer': 'https://prod-web.neu.edu/wasapp/employeelookup/public/searchEmployees.action'
				},
				body: body
			}, function (err, resp, body) {
				if (err) {
					console.log("Failed to get letters", err, num)
					reject(error)
					return;
				}
				resolve(body)
			})
		}).catch(retry);
	})

}



function get(lastNameStart) {
	return new Promise(function (resolve, reject) {
		getCookie(async function (err, cookie) {
			if (err) {
				return reject(err)
			}

			var body = await hitWithLetters(lastNameStart, cookie)

			handleRequestResponce(body, function (err, dom) {
				var elements = domutils.getElementsByTagName('table', dom)

				for (var i = 0; i < elements.length; i++) {
					var element = elements[i];

					var goal = {
						width: '100%'
					}

					if (_.isEqual(element.attribs, goal)) {

						// Delete one of the elements that is before the header that would mess stuff up
						domutils.removeElement(element.children[1].children[1])

						var parsedTable = parseTable(element)
						if (!parsedTable) {
							// console.log('Warning Unable to parse table:', lastNameStart)
							return resolve()
						}
						console.log('Found', parsedTable._rowCount, ' people on page ', lastNameStart)

						for (var i = 0; i < parsedTable._rowCount; i++) {
							var person = {};
							person.name = parsedTable.name[i].split('\n\n')[0]

							var idMatch = parsedTable.name[i].match(/.hrefparameter\s+=\s+"id=(\d+)";/i)
							if (!idMatch) {
								console.warn("Warn: unable to parse id, using random number", person.name);
								person.id = String(Math.random());
							}
							else {
								person.id = idMatch[1]
							}

							var phone = parsedTable.phone[i];
							phone = phone.replace(/\D/g, '')


							// Maybe add support for guesing area code if it is ommitted and most of the other ones have the same area code
							if (phone.length === 10) {
								person.phone = phone;
							}

							person.email = parsedTable.email[i];
							person.primaryappointment = parsedTable.primaryappointment[i];
							person.primarydepartment = parsedTable.primarydepartment[i];
							people.push(person)
							index.addDoc(person)
							peopleMap[person.id] = person
						}
						return resolve();
					}
				}

				console.log('YOOOOO it didnt find the table')
				console.log(body)

				return reject('nope');

			}.bind(this))
		}.bind(this))
	})

}

async function main() {

	var promises = []

	alphabet.split('').forEach(function (firstLetter) {
		alphabet.split('').forEach(function (secondLetter) {
			promises.push(get(firstLetter + secondLetter))
		}.bind(this))
	}.bind(this))


	await Promise.all(promises)

	var rootFolder = path.join('..', 'compiled_frontend', 'getEmployees', 'neu.edu')

	await mkdirp(rootFolder)

	await fs.writeFile(path.join(rootFolder, "data.json"), JSON.stringify(people))


	await fs.writeFile(path.join(rootFolder, "searchIndex.json"), JSON.stringify(index.toJSON()))


	await fs.writeFile(path.join(rootFolder, "map.json"), JSON.stringify(peopleMap))

	console.log("All 3 files saved!");
}

exports.go = main

if (require.main === module) {
	main()
}

// getCookie(function (err, cookie) {
// 	console.log(err, cookie);
// }.bind(this))
