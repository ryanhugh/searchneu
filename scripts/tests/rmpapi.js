var employeeData = require('./data.json')
var rmp = require("rmp-api");
var nameParser = require('another-name-parser')
var fs = require('fs');


var items = {}
var rows = []

/** Function that count occurrences of a substring in a string;
 * @param {String} string               The string
 * @param {String} subString            The sub string to search for
 * @param {Boolean} [allowOverlapping]  Optional. (Default:false)
 *
 * @author Vitim.us https://gist.github.com/victornpb/7736865
 * @see Unit Test https://jsfiddle.net/Victornpb/5axuh96u/
 * @see http://stackoverflow.com/questions/4009756/how-to-count-string-occurrence-in-string/7924240#7924240
 */
function occurrences(string, subString, allowOverlapping) {

	string += "";
	subString += "";
	if (subString.length <= 0) return (string.length + 1);

	var n = 0,
		pos = 0,
		step = allowOverlapping ? 1 : subString.length;

	while (true) {
		pos = string.indexOf(subString, pos);
		if (pos >= 0) {
			++n;
			pos += step;
		}
		else break;
	}
	return n;
}

function wlog(warning) {

	var arr = [].slice.call(arguments)
	arr = ['Warning: '].concat(arr)
	console.log.apply(console.log, arr)
}

// Given a list of things, will find the first one that is longer than 1 letter (a-z)
function findName(list) {

	for (var i = 0; i < list.length; i++) {
		var noSymbols = list[i].toLowerCase().replace(/[^0-9a-zA-Z]/gi, '')

		if (noSymbols.length > 1 && !['ii', 'iii', 'jr', 'sr', 'dr'].includes(noSymbols)) {
			return list[i]
		}
	}
	console.log('!!!', list)
	return list[0]
}


employeeData.forEach(function (row) {

	var toCompare = row.primaryappointment.toLowerCase()

	if (toCompare.includes('prof') || toCompare.includes('lecturer')) {
		rows.push(row)

		var nameParsed = nameParser(row.name)

		if (row.name.match(/jr.,/gi)) {
			// console.log(row.name)
			row.name = row.name.replace(/, jr.,/gi, ',')
		}

		if (occurrences(row.name, ',') != 1) {
			wlog('Name has != commas', row.name)
			return
		}

		var splitOnComma = row.name.split(',')

		var beforeCommaSplit = splitOnComma[1].trim().split(' ')
		var firstName = findName(beforeCommaSplit)

		var afterCommaSplit = splitOnComma[0].trim().split(' ').reverse()
		var lastname = findName(afterCommaSplit)

		row.firstName = firstName
		row.lastname = lastname

		if (row.firstName != nameParsed.first || row.lastname != nameParsed.last) {
			console.log(nameParsed.first, nameParsed.last, '|', firstName, lastname)
		}

		// if (occurrences(row.name, ' ') != 1) {
		// 	console.log(row.name, '|', firstName, lastname)

		// }
	}
})

// console.log(rows)




var callback = function (professor) {
	if (professor === null) {
		console.log("No professor found.");
		return;
	}
	// console.log("Name: " + professor.fname + " " + professor.lname);
	// console.log("University: " + professor.university);
	// console.log("Quality: " + professor.quality);
	// console.log("Easiness: " + professor.easiness);
	// console.log("Helpfulness: " + professor.help);
	// console.log("Average Grade: " + professor.grade);
	// console.log("Chili: " + professor.chili);
	// console.log("URL: " + professor.url);
	// console.log("First comment: " + professor.comments[0]);
	console.log(JSON.stringify(professor))
};


var alreadyHad = 0
var found = 0
var missed = 0


async function getRmpData() {

	var promises = []

	rows.forEach(function (row) {
		if (!row.firstName) {
			return;
		}

		if (row.rmp.url) {
			console.log('Row already has rmp data')
			alreadyHad++
			return;
		}


		var promise = new Promise(function (resolve, reject) {
			var casualName = row.firstName + ' ' + row.lastname

			console.log(casualName)
			rmp("Northeastern University").get(casualName, function (result) {
				if (result) {
					found++
					console.log('!!!!!Got data for ', casualName)
					row.rmp = result
				}
				else {
					missed++
					console.log('No data for ', casualName)
					row.rmp = {}
				}
				resolve()
			})
		})

		promises.push(promise)
	})

	await Promise.all(promises)


	fs.writeFile("data.json", JSON.stringify(rows), function (err) {
		if (err) {
			return console.log(err);
		}

		console.log("The file was saved!");
		console.log()
		console.log(alreadyHad, 'alreadyHad')
		console.log(found, 'found')
		console.log(missed, 'missed')

	});

}

getRmpData()


// rmp("Northeastern University").get('Won-Hee An', function (result) {
// 	console.log(result)
// })
