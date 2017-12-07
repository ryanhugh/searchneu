/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */
import cheerio from 'cheerio';
import * as acorn from 'acorn';
import URI from 'urijs';
import formUrlencoded from 'form-urlencoded';


import Request from '../request';
import macros from '../../macros';


// Login code for MyNEU
// Just uses request and cheerio, no headless browser
// It looks like MyNEU is fingerprinting the browser when the tokens/cookies are generated
// and keeping track of what the UA the browser is sending and will log you out if it changes
// TRACE is doing the same thing
// Might be doing weird other random stuff too
// so they need to stay the same between requests.


const request = new Request('login', {
  cache: false,
});

const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36';

async function followRedirects(cookieJar, resp) {
  let nextUrl;

  // While status code on the response is a 302, follow it and get the new response.
  while (resp.statusCode === 302) {
    nextUrl = resp.headers.location;

    // Continuously hit the next url returned by the prior request in a while loop
    // This is correct, even though eslint is complaining
    resp = await request.get({ // eslint-disable-line no-await-in-loop
      url: nextUrl,
      jar: cookieJar,
      followRedirect: false,
      simple: false,
      headers: {
        'User-Agent': ua,
      },
    });

    macros.log('Followed a 302 and got ', resp.statusCode, resp.headers.location);
  }

  return {
    cookieJar: cookieJar,
    url: nextUrl,
    resp: resp,
  };
}

async function main() {
  const user = await macros.getEnvVariable('myNEUUsername');
  const pass = await macros.getEnvVariable('myNEUPassword');

  let cookieJar = request.jar();

  const initialGet = await request.get({
    url: 'https://myneu.neu.edu/cp/home/displaylogin',
    headers: {
      'User-Agent': ua,
    },
    jar: cookieJar,
  });

  let $ = cheerio.load(initialGet.body);
  const inside = $('script[language="javascript1.1"]');
  const parsedJS = acorn.parse(inside.text());
  if (parsedJS.body[8].id.name !== 'login') {
    macros.log('not equal to login!', parsedJS, parsedJS.body[8].id.name);
    return null;
  }

  const uuid = parsedJS.body[8].body.body[2].expression.right.value;

  // Example uuid:
  // A new one of these are generated every time the site is hit.
  // a8f5faa2-7e15-4d4b-8a05-d2884aa82a36

  macros.log('Parsed UUID from login page:', uuid);


  const resp = await request.post({
    url: 'https://myneu.neu.edu/cp/home/login',
    headers: {
      'User-Agent': ua,
      'Content-Type': 'application/x-www-form-urlencoded',
      Referer: 'https://myneu.neu.edu/cp/home/displaylogin',
    },
    jar: cookieJar,
    body: `pass=${pass}&user=${user}&uuid=${uuid}`,
  });

  macros.log('Status code:', resp.statusCode);
  macros.log('Recieved headers:', resp.headers);
  macros.log('Cookie jar:', cookieJar);
  macros.log('Got body:', resp.body);


  // The body of the first request looks like this:
  //    <html><head>
  //    <script Language="JavaScript">
  //    document.location="http://myneu.neu.edu/cps/welcome/loginok.html";
  //    </script>
  //    </head><body></body></html>


  const resp2 = await request.get({
    url: 'http://myneu.neu.edu/cps/welcome/loginok.html',
    jar: cookieJar,
    headers: {
      'User-Agent': ua,
    },
  });


  macros.verbose('2Status code:', resp2.statusCode);
  macros.verbose('2Recieved headers:', resp2.headers);
  macros.verbose('2Cookie jar:', cookieJar);
  macros.verbose('2Got body:', resp2.body);

  // resp2.body:
  // <html><title>Login Successful</title>
  // <head>
  // <script language="javascript">
  // window.top.location=/*URL*/ "/cp/home/next"
  // </script>
  // </head>
  // </html>


  const resp3 = await request.get({
    url: 'http://myneu.neu.edu/cp/home/next',
    jar: cookieJar,
    headers: {
      'User-Agent': ua,
    },
  });

  macros.verbose('3Status code:', resp3.statusCode);
  macros.verbose('3Recieved headers:', resp3.headers);
  macros.verbose('3Cookie jar:', cookieJar);
  macros.verbose('3Got body:', resp3.body);


  // resp3.body is the HTML of the default tab on MyNEU

  // Hit the Self-Service tab
  const resp4 = await request.get({
    url: 'http://myneu.neu.edu/tag.121e5fb84b31691f.render.userLayoutRootNode.uP?uP_root=root&uP_sparam=activeTab&activeTab=u117660l1s42&uP_tparam=frm&frm=',
    jar: cookieJar,
    headers: {
      'User-Agent': ua,
    },
  });


  macros.verbose('4Status code:', resp4.statusCode);
  macros.verbose('4Recieved headers:', resp4.headers);
  macros.verbose('4Cookie jar:', cookieJar);
  macros.verbose('4Got body:', resp4.body);


  // Hit the TRACE link
  const resp5 = await request.get({
    url: 'http://myneu.neu.edu/cp/ip/login?sys=cas&url=https://www.applyweb.com/eval/shibboleth/neu/36892',
    jar: cookieJar,
    followRedirect: false,
    simple: false,
    headers: {
      'User-Agent': ua,
    },
  });

  let redirectObject = await followRedirects(cookieJar, resp5);

  cookieJar = redirectObject.cookieJar;
  const resp6 = redirectObject.resp;
  let currentUrl = redirectObject.url;


  macros.verbose('6Status code:', resp6.statusCode);
  macros.verbose('6Recieved headers:', resp6.headers);
  macros.verbose('6Cookie jar:', cookieJar);
  macros.verbose('6Got body:', resp6.body);


  // This page has some JS that parsed some cookies from the current URL
  // and sets them in the browser
  // and goes to another page.

  // Run that cookie logic and then go to the next page.
  const parsedUrl = new URI(currentUrl);
  const queries = parsedUrl.query(true);

  for (const cookie of queries.cookie) {
    // This was copied from the JS that appears on this page.
    // Instead of running the entire JS, just run the important parts.
    const cookieToSet = cookie.replace(';domain=neuidmsso.neu.edu', '');
    macros.log(cookieToSet);

    // Not 100% sure about this line/??
    // Also the path/// attribute in the cookie might need modifyig? idk
    cookieJar.setCookie(cookieToSet, 'http://neu.edu');
    cookieJar.setCookie(cookieToSet, 'https://neu.edu');
    cookieJar.setCookie(cookieToSet, 'http://neuidmsso.neu.edu');
    cookieJar.setCookie(cookieToSet, 'https://neuidmsso.neu.edu');
  }

  macros.verbose('Next url is:', queries.dest);


  // Hit the next TRACE link
  const resp7 = await request.get({
    url: queries.dest,
    jar: cookieJar,
    followRedirect: false,
    simple: false,
    headers: {
      'User-Agent': ua,
    },
  });


  redirectObject = await followRedirects(cookieJar, resp7);

  cookieJar = redirectObject.cookieJar;
  const resp8 = redirectObject.resp;

  macros.verbose('8Status code:', resp8.statusCode);
  macros.verbose('8Recieved headers:', resp8.headers);
  macros.verbose('8Cookie jar:', cookieJar);
  macros.verbose('8Got body:', resp8.body);

  let nextUrl;


  // This page returns a 200 with a form on it with stuff pre-filled in
  // and as soon as the page loads, some javascript on the page submits the form
  // and the 302s continue...

  // parse the details out of the form
  // and submit it.
  $ = cheerio.load(resp8.body);

  nextUrl = $('form').attr('action');

  const inputs = $('input');

  const obj = {};

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];

    const type = $(input).attr('type');

    if (type !== 'hidden') {
      continue;
    }

    const name = $(input).attr('name');
    const value = $(input).attr('value');

    obj[name] = value;
  }

  const postBody = formUrlencoded(obj);

  macros.verbose('Submitting the post request: ', nextUrl, postBody);


  const resp9 = await request.post({
    url: nextUrl,
    jar: cookieJar,
    followRedirect: false,
    simple: false,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': ua,
    },
    body: postBody,
  });


  macros.verbose('9Status code:', resp9.statusCode);
  macros.verbose('9Recieved headers:', resp9.headers);
  macros.verbose('9Cookie jar:', cookieJar);
  macros.verbose('9Got body:', resp9.body);

  redirectObject = await followRedirects(cookieJar, resp9);

  cookieJar = redirectObject.cookieJar;
  const resp10 = redirectObject.resp;
  currentUrl = redirectObject.url;


  macros.verbose('10Status code:', resp10.statusCode);
  macros.verbose('10Recieved headers:', resp10.headers);
  macros.verbose('10Cookie jar:', cookieJar);
  macros.verbose('10Got body:', resp10.body);


  // The next url here comes from the prior url haha
  const urlParsed = new URI(currentUrl);
  nextUrl = urlParsed.query();

  // Also set the cookie that says we have passed the browser check
  cookieJar.setCookie('awBrowserCheck=true;path=/', 'https://www.applyweb.com');
  cookieJar.setCookie('awBrowserCheck=true;path=/', 'https://applyweb.com');
  cookieJar.setCookie('awBrowserCheck=true;path=/', 'http://www.applyweb.com');
  cookieJar.setCookie('awBrowserCheck=true;path=/', 'http://applyweb.com');


  const resp11 = await request.get({
    url: nextUrl,
    jar: cookieJar,
    followRedirect: false,
    simple: false,
    headers: {
      'User-Agent': ua,
    },
  });


  macros.verbose('10Status code:', resp11.statusCode);
  macros.verbose('10Recieved headers:', resp11.headers);
  macros.verbose('10Cookie jar:', cookieJar);
  macros.verbose('10Got body:', resp11.body);

  nextUrl = resp11.headers.location;


  const resp12 = await request.get({
    url: nextUrl,
    jar: cookieJar,
    followRedirect: false,
    simple: false,
    headers: {
      'User-Agent': ua,
    },
  });


  macros.verbose('11Status code:', resp12.statusCode);
  macros.verbose('11Recieved headers:', resp12.headers);
  macros.verbose('11Cookie jar:', cookieJar);
  macros.verbose('11Got body:', resp12.body);


  // Done! Send a request for one of the data elements


  const respZ = await request.get({
    url: 'https://www.applyweb.com/eval/new/showreport?c=23076&i=2309&t=55&r=2&embedded=true',
    jar: cookieJar,
    followRedirect: false,
    simple: false,
    headers: {
      'User-Agent': ua,
    },
  });


  macros.verbose('ZStatus code:', respZ.statusCode);
  macros.verbose('ZRecieved headers:', respZ.headers);
  macros.verbose('ZCookie jar:', cookieJar);
  macros.log('ZGot body:', respZ.body);

  return cookieJar;
}


main();
