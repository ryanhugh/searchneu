import cookie from 'cookie'
import cheerio from 'cheerio'
import * as acorn from 'acorn';


import Request from '../request';
import macros from '../../macros';


// Login code for MyNEU
// Just uses reqeust and cheerio, no headless browser
// It looks like MyNEU is fingerprinting the browser when the tokens/cookies are generated
// and keeping track of what the UA and possibly? other things are too
// so they need to stay the same between requests. 


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

    // debugger;



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
	// debugger	
	// return;


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


	// debugger

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

	// debugger


	// Hit the Self-Service tab
	let resp4 = await request.get({
		url: 'http://myneu.neu.edu/tag.121e5fb84b31691f.render.userLayoutRootNode.uP?uP_root=root&uP_sparam=activeTab&activeTab=u117660l1s42&uP_tparam=frm&frm=',
		jar: cookieJar,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
		}
	})


	console.log('4Sent headers:', resp4.req._headers)
	console.log('4Status code:', resp4.statusCode)
	console.log('4Recieved headers:', resp4.headers)
	console.log('4Cookie jar:', cookieJar)
	console.log('4Got body:', resp4.body)


	// debugger


	// Hit the TRACE link
	let resp5 = await request.get({
		url: 'http://myneu.neu.edu/cp/ip/login?sys=cas&url=https://www.applyweb.com/eval/shibboleth/neu/36892',
		jar: cookieJar,
		followRedirect: false,
		simple: false,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
		}
	})


	console.log('5Sent headers:', resp5.req._headers)
	console.log('5Status code:', resp5.statusCode)
	console.log('5Recieved headers:', resp5.headers)
	console.log('5Cookie jar:', cookieJar)
	console.log('5Got body:', resp5.body)

	let nextUrl = resp5.headers.location

	if (resp5.statusCode!==302) {
		console.log("not a 302?", resp5)
	}

	
	// Hit the next TRACE link
	let resp6 = await request.get({
		url: nextUrl,
		jar: cookieJar,
		followRedirect: false,
		simple: false,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
		}
	})


	console.log('6Sent headers:', resp6.req._headers)
	console.log('6Status code:', resp6.statusCode)
	console.log('6Recieved headers:', resp6.headers)
	console.log('6Cookie jar:', cookieJar)
	console.log('6Got body:', resp6.body)


	nextUrl = resp6.headers.location

	if (resp6.statusCode!==302) {
		console.log("not a 302?", resp5)
	}

	
	// Hit the next TRACE link
	let resp7 = await request.get({
		url: nextUrl,
		jar: cookieJar,
		followRedirect: false,
		simple: false,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
		}
	})


	console.log('7Sent headers:', resp7.req._headers)
	console.log('7Status code:', resp7.statusCode)
	console.log('7Recieved headers:', resp7.headers)
	console.log('7Cookie jar:', cookieJar)
	console.log('7Got body:', resp7.body)



	debugger



	// // Hit the actually TRACE page
	// let resp6 = await request.get({
	// 	url: 'https://www.applyweb.com/eval/shibboleth/neu/36892',
	// 	jar: cookieJar,
	// 	headers: {
	// 		'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
	// 	}
	// })


	// console.log('6Sent headers:', resp6.req._headers)
	// console.log('6Status code:', resp6.statusCode)
	// console.log('6Recieved headers:', resp6.headers)
	// console.log('6Cookie jar:', cookieJar)
	// console.log('6Got body:', resp6.body)


	// debugger





}



main();