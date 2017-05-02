import csv from 'csvdata'
import URI from 'urijs'


async function main() {

	var data = await csv.load('myfile.csv', {
		logging: false
	})
	
	var out = {}

	data.forEach(function(row) {
		var site = (new URI('http://'+row.WEBADDR)).domain()

		if (out[site]) {
			console.log(row.INSTNM, out[site])
		}

		out[site] = row.INSTNM
	})

	// console.log(JSON.stringify(out))
	console.log(out['northeastern.edu'])

}

main()