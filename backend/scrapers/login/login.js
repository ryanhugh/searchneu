import cookie from 'cookie'
import cheerio from 'cheerio'
import * as acorn from 'acorn';
import URI from 'urijs';


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


	// This page has some JS that parsed some cookies from the current URL
	// and sets them in the browser
	// and goes to another page.

	// Run that cookie logic and then go to the next page. 
	let parsedUrl = new URI(nextUrl)
	let queries = parsedUrl.query(true)

	for (let cookie of queries.cookie) {

	    // This was copied from the JS that appears on this page.
	    // Instead of running the entire JS, just run the important parts.
	    let cookieToSet = cookie.replace(";domain=neuidmsso.neu.edu", "");
	    console.log(cookieToSet)

	    // Not 100% sure about this line/??
	    // Also the path/// attribute in the cookie might need modifyig? idk
	    cookieJar.setCookie(cookieToSet, 'http://neu.edu')
	    cookieJar.setCookie(cookieToSet, 'https://neu.edu')
	    cookieJar.setCookie(cookieToSet, 'http://neuidmsso.neu.edu')
	    cookieJar.setCookie(cookieToSet, 'https://neuidmsso.neu.edu')
	}

	console.log(queries.dest)
	console.log(queries.dest)




	debugger


	
	// Hit the next TRACE link
	let resp8 = await request.get({
		url: queries.dest,
		jar: cookieJar,
		followRedirect: false,
		simple: false,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
		}
	})


	console.log('8Sent headers:', resp8.req._headers)
	console.log('8Status code:', resp8.statusCode)
	console.log('8Recieved headers:', resp8.headers)
	console.log('8Cookie jar:', cookieJar)
	console.log('8Got body:', resp8.body)


	// 8 is 302'ed right now, going to let is auto-follow and if that dosen't work just follow manually

	nextUrl = resp8.headers.location
	debugger

	
	let resp9 = await request.get({
		url: nextUrl,
		jar: cookieJar,
		followRedirect: false,
		simple: false,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
		}
	})


	console.log('9Sent headers:', resp9.req._headers)
	console.log('9Status code:', resp9.statusCode)
	console.log('9Recieved headers:', resp9.headers)
	console.log('9Cookie jar:', cookieJar)
	console.log('9Got body:', resp9.body)




	// 8 is 302'ed right now, going to let is auto-follow and if that dosen't work just follow manually

	nextUrl = resp9.headers.location
	debugger

	
	let respA = await request.get({
		url: nextUrl,
		jar: cookieJar,
		followRedirect: false,
		simple: false,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.A0 Safari/537.36',
		}
	})


	console.log('ASent headers:', respA.req._headers)
	console.log('AStatus code:', respA.statusCode)
	console.log('ARecieved headers:', respA.headers)
	console.log('ACookie jar:', cookieJar)
	console.log('AGot body:', respA.body)




	// 8 is 302'ed right now, going to let is auto-follow and if that dosen't work just follow manually

	nextUrl = respA.headers.location
	debugger

	
	let respB = await request.get({
		url: nextUrl,
		jar: cookieJar,
		followRedirect: false,
		simple: false,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.A0 Safari/537.36',
		}
	})


	console.log('BSent headers:', respB.req._headers)
	console.log('BStatus code:', respB.statusCode)
	console.log('BRecieved headers:', respB.headers)
	console.log('BCookie jar:', cookieJar)
	console.log('BGot body:', respB.body)

	// going to 302 to extcas


	nextUrl = respB.headers.location
	debugger

	let respC = await request.get({
		url: nextUrl,
		jar: cookieJar,
		followRedirect: false,
		simple: false,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.A0 Safari/537.36',
		}
	})


	console.log('CSent headers:', respC.req._headers)
	console.log('CStatus code:', respC.statusCode)
	console.log('CRecieved headers:', respC.headers)
	console.log('CCookie jar:', cookieJar)
	console.log('CGot body:', respC.body)

	// 302 to login?service=

	nextUrl = respC.headers.location
	debugger

	let respD = await request.get({
		url: nextUrl,
		jar: cookieJar,
		followRedirect: false,
		simple: false,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.A0 Safari/537.36',
		}
	})


	console.log('DSent headers:', respD.req._headers)
	console.log('DStatus code:', respD.statusCode)
	console.log('DRecieved headers:', respD.headers)
	console.log('DCookie jar:', cookieJar)
	console.log('DGot body:', respD.body)

	// 302 to ExtCas with a ticket param


	nextUrl = respD.headers.location
	debugger

	let respE = await request.get({
		url: nextUrl,
		jar: cookieJar,
		followRedirect: false,
		simple: false,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.A0 Safari/537.36',
		}
	})


	console.log('ESent headers:', respE.req._headers)
	console.log('EStatus code:', respE.statusCode)
	console.log('ERecieved headers:', respE.headers)
	console.log('ECookie jar:', cookieJar)
	console.log('EGot body:', respE.body)

	// 200 at SSO?execution - 


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