import cookie from 'cookie'
import cheerio from 'cheerio'
import * as acorn from 'acorn';


import Request from '../request';
import macros from '../../macros';



const request = new Request('login');

async function main() {

	let user = await macros.getEnvVariable('myNEUUsername')
	let pass = await macros.getEnvVariable('myNEUPassword')

	console.log(user, pass)


	let cookieJar = request.jar()

	let initialGet = await request.get({
		url: 'https://myneu.neu.edu/cp/home/displaylogin',
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36'
		},
		jar: cookieJar
	})

	let $ = cheerio.load(initialGet.body)
	let inside = $('script[language="javascript1.1"]')
	let parsedJS = acorn.parse(inside.text())
	if (parsedJS.body[8].id.name !== 'login') {
		console.log("not equal to login!", parsedJS, parsedJS.body[8].id.name)
		return;
	}

	let uuid = parsedJS.body[8].body.body[2].expression.right.value


	console.log(uuid)

    // const ast = acorn.parse(initialGet.body);

    debugger;



	let resp = await request.post({
		url: 'https://myneu.neu.edu/cp/home/login',
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
			'Content-Type': 'application/x-www-form-urlencoded',
			Referer: 'https://myneu.neu.edu/cp/home/displaylogin'
		},
		jar: cookieJar,
		body: 'pass=' + pass + '&user=' + user + '&uuid=' + uuid
	})

	console.log('Sent headers:', resp.req._headers)
	console.log('Status code:', resp.statusCode)
	console.log('Recieved headers:', resp.headers)
	console.log('Cookie jar:', cookieJar)
	console.log('Got body:', resp.body)

	$ = cheerio.load(resp.body)
	console.log($('#msg_txt').text())
	debugger	
	// return;



	// let resp2 = await request.get({
	// 	url: 'http://myneu.neu.edu/tag.121e5fb84b31691f.render.userLayoutRootNode.uP?uP_root=root&uP_sparam=activeTab&activeTab=u117660l1s42&uP_tparam=frm&frm=',
	// 	jar: cookieJar
	// })

	// console.log(resp2.body)

	let resp2 = await request.get({
		url: 'http://myneu.neu.edu/cps/welcome/loginok.html',
		jar: cookieJar,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
		}
	})


	console.log('2Sent headers:', resp2.req._headers)
	console.log('2Status code:', resp2.statusCode)
	console.log('2Recieved headers:', resp2.headers)
	console.log('2Cookie jar:', cookieJar)
	console.log('2Got body:', resp2.body)


	debugger

	let resp3 = await request.get({
		url: 'http://myneu.neu.edu/cp/home/next',
		jar: cookieJar,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
		}
	})


	console.log('3Sent headers:', resp3.req._headers)
	console.log('3Status code:', resp3.statusCode)
	console.log('3Recieved headers:', resp3.headers)
	console.log('3Cookie jar:', cookieJar)
	console.log('3Got body:', resp3.body)


	debugger


}



main();