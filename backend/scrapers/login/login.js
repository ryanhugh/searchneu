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

	let cookieJar = request.jar()

	let initialGet = await request.get({
		url: 'https://myneu.neu.edu/cp/home/displaylogin',
		headers: {
			'User-Agent': ua
		},
		jar: cookieJar
	})

	let $ = cheerio.load(initialGet.body)
	let inside = $('script[language="javascript1.1"]')
	let parsedJS = acorn.parse(inside.text())
	if (parsedJS.body[8].id.name !== 'login') {
		macros.log("not equal to login!", parsedJS, parsedJS.body[8].id.name)
		return;
	}

	let uuid = parsedJS.body[8].body.body[2].expression.right.value

	// Example uuid:
	// A new one of these are generated every time the site is hit. 
	// a8f5faa2-7e15-4d4b-8a05-d2884aa82a36

	macros.log('Parsed UUID from login page:', uuid)


	let resp = await request.post({
		url: 'https://myneu.neu.edu/cp/home/login',
		headers: {
			'User-Agent': ua,
			'Content-Type': 'application/x-www-form-urlencoded',
			Referer: 'https://myneu.neu.edu/cp/home/displaylogin'
		},
		jar: cookieJar,
		body: 'pass=' + pass + '&user=' + user + '&uuid=' + uuid
	})

	macros.log('Status code:', resp.statusCode)
	macros.log('Recieved headers:', resp.headers)
	macros.log('Cookie jar:', cookieJar)
	macros.log('Got body:', resp.body)


	// The body of the first request looks like this: 
	//    <html><head>
  //    <script Language="JavaScript">
  //    document.location="http://myneu.neu.edu/cps/welcome/loginok.html";
  //    </script>
  //    </head><body></body></html>



	let resp2 = await request.get({
		url: 'http://myneu.neu.edu/cps/welcome/loginok.html',
		jar: cookieJar,
		headers: {
			'User-Agent': ua,
		}
	})


	macros.verbose('2Status code:', resp2.statusCode)
	macros.verbose('2Recieved headers:', resp2.headers)
	macros.verbose('2Cookie jar:', cookieJar)
	macros.verbose('2Got body:', resp2.body)

	// resp2.body:
	// <html><title>Login Successful</title>
	// <head>
	// <script language="javascript">
	// window.top.location=/*URL*/ "/cp/home/next"
	// </script>
	// </head>
	// </html>


	let resp3 = await request.get({
		url: 'http://myneu.neu.edu/cp/home/next',
		jar: cookieJar,
		headers: {
			'User-Agent': ua,
		}
	})


	// macros.verbose('3Sent headers:', resp3.req._headers)
	macros.verbose('3Status code:', resp3.statusCode)
	macros.verbose('3Recieved headers:', resp3.headers)
	macros.verbose('3Cookie jar:', cookieJar)
	macros.verbose('3Got body:', resp3.body)

	// debugger


	// resp3.body is the HTML of the default tab on MyNEU

	// Hit the Self-Service tab
	let resp4 = await request.get({
		url: 'http://myneu.neu.edu/tag.121e5fb84b31691f.render.userLayoutRootNode.uP?uP_root=root&uP_sparam=activeTab&activeTab=u117660l1s42&uP_tparam=frm&frm=',
		jar: cookieJar,
		headers: {
			'User-Agent': ua,
		}
	})


	// macros.verbose('4Sent headers:', resp4.req._headers)
	macros.verbose('4Status code:', resp4.statusCode)
	macros.verbose('4Recieved headers:', resp4.headers)
	macros.verbose('4Cookie jar:', cookieJar)
	macros.verbose('4Got body:', resp4.body)


	// debugger


	// Hit the TRACE link
	let resp5 = await request.get({
		url: 'http://myneu.neu.edu/cp/ip/login?sys=cas&url=https://www.applyweb.com/eval/shibboleth/neu/36892',
		jar: cookieJar,
		followRedirect: false,
		simple: false,
		headers: {
			'User-Agent': ua,
		}
	})

  let redirectObject = await followRedirects(cookieJar, resp5)

  cookieJar = redirectObject.cookieJar;
  let resp7 = redirectObject.resp;
  let currentUrl = redirectObject.url;
  debugger


	// macros.verbose('7Sent headers:', resp7.req._headers)
	macros.verbose('7Status code:', resp7.statusCode)
	macros.verbose('7Recieved headers:', resp7.headers)
	macros.verbose('7Cookie jar:', cookieJar)
	macros.verbose('7Got body:', resp7.body)


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
	    macros.log(cookieToSet)

	    // Not 100% sure about this line/??
	    // Also the path/// attribute in the cookie might need modifyig? idk
	    cookieJar.setCookie(cookieToSet, 'http://neu.edu')
	    cookieJar.setCookie(cookieToSet, 'https://neu.edu')
	    cookieJar.setCookie(cookieToSet, 'http://neuidmsso.neu.edu')
	    cookieJar.setCookie(cookieToSet, 'https://neuidmsso.neu.edu')
	}

	macros.verbose(queries.dest)
	macros.verbose(queries.dest)




	// debugger


	
	// Hit the next TRACE link
	let resp8 = await request.get({
		url: queries.dest,
		jar: cookieJar,
		followRedirect: false,
		simple: false,
		headers: {
			'User-Agent': ua,
		}
	})


	// macros.verbose('8Sent headers:', resp8.req._headers)
	macros.verbose('8Status code:', resp8.statusCode)
	macros.verbose('8Recieved headers:', resp8.headers)
	macros.verbose('8Cookie jar:', cookieJar)
	macros.verbose('8Got body:', resp8.body)


	// 8 is 302'ed right now, going to let is auto-follow and if that dosen't work just follow manually

	let nextUrl = resp8.headers.location
	// debugger

	
	let resp9 = await request.get({
		url: nextUrl,
		jar: cookieJar,
		followRedirect: false,
		simple: false,
		headers: {
			'User-Agent': ua,
		}
	})


	// macros.verbose('9Sent headers:', resp9.req._headers)
	macros.verbose('9Status code:', resp9.statusCode)
	macros.verbose('9Recieved headers:', resp9.headers)
	macros.verbose('9Cookie jar:', cookieJar)
	macros.verbose('9Got body:', resp9.body)




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


	// macros.verbose('ASent headers:', respA.req._headers)
	macros.verbose('AStatus code:', respA.statusCode)
	macros.verbose('ARecieved headers:', respA.headers)
	macros.verbose('ACookie jar:', cookieJar)
	macros.verbose('AGot body:', respA.body)




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


	// macros.verbose('BSent headers:', respB.req._headers)
	macros.verbose('BStatus code:', respB.statusCode)
	macros.verbose('BRecieved headers:', respB.headers)
	macros.verbose('BCookie jar:', cookieJar)
	macros.verbose('BGot body:', respB.body)

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


	// macros.verbose('CSent headers:', respC.req._headers)
	macros.verbose('CStatus code:', respC.statusCode)
	macros.verbose('CRecieved headers:', respC.headers)
	macros.verbose('CCookie jar:', cookieJar)
	macros.verbose('CGot body:', respC.body)

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


	// macros.verbose('DSent headers:', respD.req._headers)
	macros.verbose('DStatus code:', respD.statusCode)
	macros.verbose('DRecieved headers:', respD.headers)
	macros.verbose('DCookie jar:', cookieJar)
	macros.verbose('DGot body:', respD.body)

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


	// macros.verbose('ESent headers:', respE.req._headers)
	macros.verbose('EStatus code:', respE.statusCode)
	macros.verbose('ERecieved headers:', respE.headers)
	macros.verbose('ECookie jar:', cookieJar)
	macros.verbose('EGot body:', respE.body)

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

    macros.verbose("Submitting the post request: ", nextUrl, postBody)


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


	// macros.verbose('FSent headers:', respF.req._headers)
	macros.verbose('FStatus code:', respF.statusCode)
	macros.verbose('FRecieved headers:', respF.headers)
	macros.verbose('FCookie jar:', cookieJar)
	macros.verbose('FGot body:', respF.body)


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


	// macros.verbose('GSent headers:', respG.req._headers)
	macros.verbose('GStatus code:', respG.statusCode)
	macros.verbose('GRecieved headers:', respG.headers)
	macros.verbose('GCookie jar:', cookieJar)
	macros.verbose('GGot body:', respG.body)


	
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


	// macros.verbose('HSent headers:', respH.req._headers)
	macros.verbose('HStatus code:', respH.statusCode)
	macros.verbose('HRecieved headers:', respH.headers)
	macros.verbose('HCookie jar:', cookieJar)
	macros.verbose('HGot body:', respH.body)

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


	// macros.verbose('ISent headers:', respI.req._headers)
	macros.verbose('IStatus code:', respI.statusCode)
	macros.verbose('IRecieved headers:', respI.headers)
	macros.verbose('ICookie jar:', cookieJar)
	macros.verbose('IGot body:', respI.body)



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


	// macros.verbose('JSent headers:', respJ.req._headers)
	macros.verbose('JStatus code:', respJ.statusCode)
	macros.verbose('JRecieved headers:', respJ.headers)
	macros.verbose('JCookie jar:', cookieJar)
	macros.verbose('JGot body:', respJ.body)

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


	// macros.verbose('KSent headers:', respK.req._headers)
	macros.verbose('KStatus code:', respK.statusCode)
	macros.verbose('KRecieved headers:', respK.headers)
	macros.verbose('KCookie jar:', cookieJar)
	macros.verbose('KGot body:', respK.body)

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


	// macros.verbose('ZSent headers:', respZ.req._headers)
	macros.verbose('ZStatus code:', respZ.statusCode)
	macros.verbose('ZRecieved headers:', respZ.headers)
	macros.verbose('ZCookie jar:', cookieJar)
	macros.verbose('ZGot body:', respZ.body)

	debugger


	

	// // Hit the actually TRACE page
	// let resp6 = await request.get({
	// 	url: 'https://www.applyweb.com/eval/shibboleth/neu/36892',
	// 	jar: cookieJar,
	// 	headers: {
	// 		'User-Agent': ua,
	// 	}
	// })


	// macros.verbose('6Sent headers:', resp6.req._headers)
	// macros.log('6Status code:', resp6.statusCode)
	// macros.log('6Recieved headers:', resp6.headers)
	// macros.log('6Cookie jar:', cookieJar)
	// macros.log('6Got body:', resp6.body)


	// debugger





}



main();