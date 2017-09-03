import cookie from 'cookie'
import cheerio from 'cheerio'
import * as acorn from 'acorn';
import URI from 'urijs';
import formUrlencoded from 'form-urlencoded';


import Request from '../request';
import macros from '../../macros';


// Login code for MyNEU
// Just uses reqeust and cheerio, no headless browser
// It looks like MyNEU is fingerprinting the browser when the tokens/cookies are generated
// and keeping track of what the UA and possibly? other things are too
// so they need to stay the same between requests. 


const request = new Request('login');

const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36';

async function followRedirects(cookieJar, resp) {

  let nextUrl;

  // While status code on the response is a 302, follow it and get the new response.
  while (resp.statusCode == 302) {

    nextUrl = resp.headers.location
    
    resp = await request.get({
      url: nextUrl,
      jar: cookieJar,
      followRedirect: false,
      simple: false,
      headers: {
        'User-Agent': ua,
      }
    })

    macros.log("Followed a 302 and got ", resp.statusCode, resp.headers.location)

  }

  return {
    cookieJar: cookieJar,
    url: nextUrl,
    resp: resp
  }
}

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

	// Example uuid:
	// A new one of these are generated every time the site is hit. 
	// a8f5faa2-7e15-4d4b-8a05-d2884aa82a36


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

	// console.log('Sent headers:', resp.req._headers)
	console.log('Status code:', resp.statusCode)
	console.log('Recieved headers:', resp.headers)
	console.log('Cookie jar:', cookieJar)
	console.log('Got body:', resp.body)

	$ = cheerio.load(resp.body)
	console.log($('#msg_txt').text())

	// The body of the first request looks like this: 
	//    <html><head>
//    <script Language="JavaScript">
//    document.location="http://myneu.neu.edu/cps/welcome/loginok.html";
//    </script>
//    </head><body></body></html>


	// debugger	
	// return;


	let resp2 = await request.get({
		url: 'http://myneu.neu.edu/cps/welcome/loginok.html',
		jar: cookieJar,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
		}
	})


	// console.log('2Sent headers:', resp2.req._headers)
	console.log('2Status code:', resp2.statusCode)
	console.log('2Recieved headers:', resp2.headers)
	console.log('2Cookie jar:', cookieJar)
	console.log('2Got body:', resp2.body)

	// resp2.body:
	// <html><title>Login Successful</title>
	// <head>
	// <script language="javascript">
	// window.top.location=/*URL*/ "/cp/home/next"
	// </script>
	// </head>
	// </html>


	// debugger

	let resp3 = await request.get({
		url: 'http://myneu.neu.edu/cp/home/next',
		jar: cookieJar,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
		}
	})


	// console.log('3Sent headers:', resp3.req._headers)
	console.log('3Status code:', resp3.statusCode)
	console.log('3Recieved headers:', resp3.headers)
	console.log('3Cookie jar:', cookieJar)
	console.log('3Got body:', resp3.body)

	// debugger


	// resp3.body is the HTML of the default tab on MyNEU

	// Hit the Self-Service tab
	let resp4 = await request.get({
		url: 'http://myneu.neu.edu/tag.121e5fb84b31691f.render.userLayoutRootNode.uP?uP_root=root&uP_sparam=activeTab&activeTab=u117660l1s42&uP_tparam=frm&frm=',
		jar: cookieJar,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
		}
	})


	// console.log('4Sent headers:', resp4.req._headers)
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

  let redirectObject = await followRedirects(cookieJar, resp5)

  cookieJar = redirectObject.cookieJar;
  let resp7 = redirectObject.resp;
  let currentUrl = redirectObject.url;
  debugger


	// console.log('7Sent headers:', resp7.req._headers)
	console.log('7Status code:', resp7.statusCode)
	console.log('7Recieved headers:', resp7.headers)
	console.log('7Cookie jar:', cookieJar)
	console.log('7Got body:', resp7.body)


	// This page has some JS that parsed some cookies from the current URL
	// and sets them in the browser
	// and goes to another page.

	// Run that cookie logic and then go to the next page. 
	let parsedUrl = new URI(currentUrl)
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




	// debugger


	
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


	// console.log('8Sent headers:', resp8.req._headers)
	console.log('8Status code:', resp8.statusCode)
	console.log('8Recieved headers:', resp8.headers)
	console.log('8Cookie jar:', cookieJar)
	console.log('8Got body:', resp8.body)


	// 8 is 302'ed right now, going to let is auto-follow and if that dosen't work just follow manually

	let nextUrl = resp8.headers.location
	// debugger

	
	let resp9 = await request.get({
		url: nextUrl,
		jar: cookieJar,
		followRedirect: false,
		simple: false,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
		}
	})


	// console.log('9Sent headers:', resp9.req._headers)
	console.log('9Status code:', resp9.statusCode)
	console.log('9Recieved headers:', resp9.headers)
	console.log('9Cookie jar:', cookieJar)
	console.log('9Got body:', resp9.body)




	// 8 is 302'ed right now, going to let is auto-follow and if that dosen't work just follow manually

	nextUrl = resp9.headers.location
	// debugger

	
	let respA = await request.get({
		url: nextUrl,
		jar: cookieJar,
		followRedirect: false,
		simple: false,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.A0 Safari/537.36',
		}
	})


	// console.log('ASent headers:', respA.req._headers)
	console.log('AStatus code:', respA.statusCode)
	console.log('ARecieved headers:', respA.headers)
	console.log('ACookie jar:', cookieJar)
	console.log('AGot body:', respA.body)




	// 8 is 302'ed right now, going to let is auto-follow and if that dosen't work just follow manually

	nextUrl = respA.headers.location
	// debugger

	
	let respB = await request.get({
		url: nextUrl,
		jar: cookieJar,
		followRedirect: false,
		simple: false,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.A0 Safari/537.36',
		}
	})


	// console.log('BSent headers:', respB.req._headers)
	console.log('BStatus code:', respB.statusCode)
	console.log('BRecieved headers:', respB.headers)
	console.log('BCookie jar:', cookieJar)
	console.log('BGot body:', respB.body)

	// going to 302 to extcas


	nextUrl = respB.headers.location
	// debugger

	let respC = await request.get({
		url: nextUrl,
		jar: cookieJar,
		followRedirect: false,
		simple: false,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.A0 Safari/537.36',
		}
	})


	// console.log('CSent headers:', respC.req._headers)
	console.log('CStatus code:', respC.statusCode)
	console.log('CRecieved headers:', respC.headers)
	console.log('CCookie jar:', cookieJar)
	console.log('CGot body:', respC.body)

	// 302 to login?service=

	nextUrl = respC.headers.location
	// debugger

	let respD = await request.get({
		url: nextUrl,
		jar: cookieJar,
		followRedirect: false,
		simple: false,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.A0 Safari/537.36',
		}
	})


	// console.log('DSent headers:', respD.req._headers)
	console.log('DStatus code:', respD.statusCode)
	console.log('DRecieved headers:', respD.headers)
	console.log('DCookie jar:', cookieJar)
	console.log('DGot body:', respD.body)

	// 302 to ExtCas with a ticket param


	nextUrl = respD.headers.location
	// debugger

	let respE = await request.get({
		url: nextUrl,
		jar: cookieJar,
		followRedirect: false,
		simple: false,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.A0 Safari/537.36',
		}
	})


	// console.log('ESent headers:', respE.req._headers)
	console.log('EStatus code:', respE.statusCode)
	console.log('ERecieved headers:', respE.headers)
	console.log('ECookie jar:', cookieJar)
	console.log('EGot body:', respE.body)

	// 200 at SSO?execution - 


	// debugger

	// This page returns a 200 with a form on it with stuff pre-filled in
	// and as soon as the page loads, some javascript on the page submits the form
	// and the 302s continue...

	// parse the details out of the form
	// and submit it.
	$ = cheerio.load(respE.body)

    nextUrl = $('form').attr('action')

    let inputs = $('input')

    let obj = {}

    for (var i = 0; i < inputs.length; i++) {
        let input = inputs[i]

        let type = $(input).attr('type')

        if (type !== 'hidden') {
            continue;
        }

        let name = $(input).attr('name')
        let value = $(input).attr('value')

        obj[name] = value
    }

    let postBody = formUrlencoded(obj)

    console.log("Submitting the post request: ", nextUrl, postBody)


	// debugger

	let respF = await request.post({
		url: nextUrl,
		jar: cookieJar,
		followRedirect: false,
		simple: false,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.A0 Safari/537.36',
		},
		body: postBody
	})


	// console.log('FSent headers:', respF.req._headers)
	console.log('FStatus code:', respF.statusCode)
	console.log('FRecieved headers:', respF.headers)
	console.log('FCookie jar:', cookieJar)
	console.log('FGot body:', respF.body)


	nextUrl = respF.headers.location
	// debugger



	let respG = await request.get({
		url: nextUrl,
		jar: cookieJar,
		followRedirect: false,
		simple: false,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.A0 Safari/537.36',
		}
	})


	// console.log('GSent headers:', respG.req._headers)
	console.log('GStatus code:', respG.statusCode)
	console.log('GRecieved headers:', respG.headers)
	console.log('GCookie jar:', cookieJar)
	console.log('GGot body:', respG.body)


	
	nextUrl = respG.headers.location
	// debugger



	let respH = await request.get({
		url: nextUrl,
		jar: cookieJar,
		followRedirect: false,
		simple: false,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.A0 Safari/537.36',
		}
	})


	// console.log('HSent headers:', respH.req._headers)
	console.log('HStatus code:', respH.statusCode)
	console.log('HRecieved headers:', respH.headers)
	console.log('HCookie jar:', cookieJar)
	console.log('HGot body:', respH.body)

	nextUrl = respH.headers.location
	// debugger



	let respI = await request.get({
		url: nextUrl,
		jar: cookieJar,
		followRedirect: false,
		simple: false,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.A0 Safari/537.36',
		}
	})


	// console.log('ISent headers:', respI.req._headers)
	console.log('IStatus code:', respI.statusCode)
	console.log('IRecieved headers:', respI.headers)
	console.log('ICookie jar:', cookieJar)
	console.log('IGot body:', respI.body)



	// The next url here comes from the prior url haha

	let urlParsed = new URI(nextUrl)
	nextUrl = urlParsed.query()

	// Also set the cookie that says we have passed the browser check
	cookieJar.setCookie("awBrowserCheck=true;path=/", 'https://www.applyweb.com')
	cookieJar.setCookie("awBrowserCheck=true;path=/", 'https://applyweb.com')
	cookieJar.setCookie("awBrowserCheck=true;path=/", 'http://www.applyweb.com')
	cookieJar.setCookie("awBrowserCheck=true;path=/", 'http://applyweb.com')
	// debugger



	let respJ = await request.get({
		url: nextUrl,
		jar: cookieJar,
		followRedirect: false,
		simple: false,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.A0 Safari/537.36',
		}
	})


	// console.log('JSent headers:', respJ.req._headers)
	console.log('JStatus code:', respJ.statusCode)
	console.log('JRecieved headers:', respJ.headers)
	console.log('JCookie jar:', cookieJar)
	console.log('JGot body:', respJ.body)

	nextUrl = respJ.headers.location
	// debugger


	let respK = await request.get({
		url: nextUrl,
		jar: cookieJar,
		followRedirect: false,
		simple: false,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.A0 Safari/537.36',
		}
	})


	// console.log('KSent headers:', respK.req._headers)
	console.log('KStatus code:', respK.statusCode)
	console.log('KRecieved headers:', respK.headers)
	console.log('KCookie jar:', cookieJar)
	console.log('KGot body:', respK.body)

	// debugger


	// Done! Send a request for one of the data elements



	let respZ = await request.get({
		url: 'https://www.applyweb.com/eval/new/showreport?c=23076&i=2309&t=55&r=2&embedded=true',
		jar: cookieJar,
		followRedirect: false,
		simple: false,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.A0 Safari/537.36',
		}
	})


	// console.log('ZSent headers:', respZ.req._headers)
	console.log('ZStatus code:', respZ.statusCode)
	console.log('ZRecieved headers:', respZ.headers)
	console.log('ZCookie jar:', cookieJar)
	console.log('ZGot body:', respZ.body)

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