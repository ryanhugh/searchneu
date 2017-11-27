/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import path from 'path';
import express from 'express';
import webpack from 'webpack';
import webpackMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import wrap from 'express-async-wrap';
import fs from 'fs-promise';
import compress from 'compression';
import rollbar from 'rollbar';
import bodyParser from 'body-parser';
import mkdirp from 'mkdirp-promise';
import moment from 'moment';

import Request from './scrapers/request';
import search from '../common/search';
import webpackConfig from './webpack.config.babel';
import macros from './macros';
// import notifyer from './notifyer';
// import psylink from './scrapers/psylink/psylink';

const request = new Request('server');

const app = express();


// Start watching for new labs
// psylink.startWatch();

// gzip the output
app.use(compress());

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// Process application/json
app.use(bodyParser.json());

// Prevent being in an iFrame.
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (macros.PROD) {
    // Assets are cached for a day.
    // This time interval was chosen because the scrapers are ran daily, so there is no point for the browser to update the cache more often that this.
    // These Cache-control headers are far from perfect though haha
    res.setHeader('Cache-Control', 'public, max-age=86400');
  } else {
    // Don't cache in DEV
    // Could also use no-store which would prevent the browser from storing it all.
    // This no-cache header requires the browser to revalidate the cache with the server before serving it.
    res.setHeader('Cache-Control', 'no-cache');
  }
  next();
});

// Prefer the headers if they are present so we get the real ip instead of localhost (nginx) or a cloudflare IP
function getIpPath(req) {
  const output = [];

  const realIpHeader = req.headers['x-real-ip'];
  if (realIpHeader) {
    output.push('Real:');
    output.push(realIpHeader);
    output.push(' ');
  }

  const forwardedForHeader = req.headers['x-forwarded-for'];
  if (forwardedForHeader) {
    output.push('ForwardedFor:');
    output.push(forwardedForHeader);
    output.push(' ');
  }

  output.push('remoteIp: ');
  output.push(req.connection.remoteAddress);

  return output.join('');
}

function getTime() {
  return moment().format('hh:mm:ss a');
}


// Http to https redirect.
app.use((req, res, next) => {
  const remoteIp = getIpPath(req);


  // If this is https request, done.
  if (req.protocol === 'https') {
    next();

  // If we are behind a cloudflare proxy and cloudflare served a https response, done.
  } else if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] === 'https') {
    next();

  // This is development mode
  } else if (macros.DEV) {
    next();

  // This is prod and still on http, redirect to https.
  } else {
    // Cache the http to https redirect for 2 months.
    res.setHeader('Cache-Control', 'public, max-age=5256000');
    macros.log(getTime(), remoteIp, 'redirecting to https');
    res.redirect(`https://${req.get('host')}${req.originalUrl}`);
  }
});


// Used for loading the data required to make the frontend work.
// This is just the data stored in public and not in cache.
// Tries to load from a local file and if that fails loads from https://searchneu.com
// And caches that locally.
async function getFrontendData(file) {
  const localPath = path.join('.', 'public', file);
  const exists = await fs.exists(localPath);

  // Exists locally, great
  if (exists) {
    const body = await fs.readFile(localPath);
    return JSON.parse(body);
  }

  macros.log('Downloading ', file, ' from searchneu.com becaues it does not exist locally.');

  // Download from https://searchneu.com
  // Note this goes through the local request cache
  let resp;
  try {
    resp = await request.get(`https://searchneu.com/${file}`);
  } catch (e) {
    macros.error('Unable to load frontend data from locally or from searchneu.com!', e);
    return null;
  }

  await mkdirp(path.dirname(localPath));

  let data;

  try {
    data = JSON.parse(resp.body);
  } catch (e) {
    macros.log('Could not download term', file, 'from server!');
    macros.log('Probably going to crash');
    return null;
  }

  // Save that locally
  await fs.writeFile(localPath, resp.body);

  return data;
}


async function getSearch() {
  const termDumpPromise = getFrontendData('data/getTermDump/neu.edu/201810.json');

  const spring2018DataPromise = getFrontendData('data/getTermDump/neu.edu/201830.json');

  const searchIndexPromise = getFrontendData('data/getSearchIndex/neu.edu/201810.json');

  const spring2018SearchIndexPromise = getFrontendData('data/getSearchIndex/neu.edu/201830.json');

  const employeeMapPromise = getFrontendData('data/employeeMap.json');

  const employeesSearchIndexPromise = getFrontendData('data/employeesSearchIndex.json');

  try {
    const fallData = await termDumpPromise;
    const springData = await spring2018DataPromise;
    const fallSearchIndex = await searchIndexPromise;
    const springSearchIndex = await spring2018SearchIndexPromise;
    const employeeMap = await employeeMapPromise;
    const employeesSearchIndex = await employeesSearchIndexPromise;

    if (!fallData || !springData || !fallSearchIndex || !springSearchIndex || !employeeMap || !employeesSearchIndex) {
      macros.log("Couldn't download a file.", !!fallData, !!springData, !!fallSearchIndex, !!springSearchIndex, !!employeeMap, !!employeesSearchIndex);
      return null;
    }

    return search.create(
      employeeMap, employeesSearchIndex,
      [{
        searchIndex: springSearchIndex,
        termDump: springData,
        termId: '201830',
      },
      {
        searchIndex: fallSearchIndex,
        termDump: fallData,
        termId: '201810',
      }],
    );
  } catch (e) {
    macros.error('Error:', e);
    macros.error('Not starting search backend.');
    return null;
  }
}

// Load the index as soon as the app starts.
const searchPromise = getSearch();

app.get('/search', wrap(async (req, res) => {
  if (!req.query.query || typeof req.query.query !== 'string' || req.query.query.length > 500) {
    macros.log(getTime(), 'Need query.', req.query);
    res.send(JSON.stringify({
      error: 'Need query param.',
    }));
    return;
  }

  if (!macros.isNumeric(req.query.minIndex) || !macros.isNumeric(req.query.maxIndex)) {
    macros.log('Need numbers as max and min index.');
    res.send(JSON.stringify({
      error: 'Max and Min index must be numbers.',
    }));
    return;
  }

  let minIndex = 0;
  if (req.query.minIndex) {
    minIndex = parseInt(req.query.minIndex, 10);
  }

  let maxIndex = 10;
  if (req.query.maxIndex) {
    maxIndex = parseInt(req.query.maxIndex, 10);
  }

  if (!req.query.termId || req.query.termId.length !== 6) {
    macros.log('Invalid termId.');
    res.send(JSON.stringify({
      error: 'Invalid termid.',
    }));
    return;
  }


  const index = await searchPromise;

  if (!index) {
    // Don't cache errors.
    res.setHeader('Cache-Control', 'no-cache, no-store');
    res.send('Could not start backend. No data found.');
    return;
  }

  const startTime = Date.now();
  const results = index.search(req.query.query, req.query.termId, minIndex, maxIndex);
  const midTime = Date.now();
  const string = JSON.stringify(results);
  macros.log(getTime(), getIpPath(req), 'Search for', req.query.query, 'took ', midTime - startTime, 'ms and stringify took', Date.now() - midTime, 'with', results.length, 'results');

  // Set the header for application/json and send the data.
  res.setHeader('Content-Type', 'application/json; charset=UTF-8');
  res.send(string);
}));


// for Facebook verification of the endpoint.
app.get('/webhook/', async (req, res) => {
  macros.log(getTime(), getIpPath(req), 'Tried to send a webhook');
  res.send('hi');
  // return;

  // macros.log(req.query);

  // const verifyToken = await macros.getEnvVariable('fbVerifyToken');

  // if (req.query['hub.verify_token'] === verifyToken) {
  //   macros.log('yup!');
  //   res.send(req.query['hub.challenge']);
  // } else {
  //   res.send('Error, wrong token');
  // }
});

// Respond to the messages
app.post('/webhook/', (req, res) => {
  // Disable temporarily
  macros.log(getTime(), getIpPath(req), 'Tried to send a webhook');
  res.send('hi');
  // return;

  // // TODO: when get this working again:
  // // 1. make sure that the requests are coming from facebook
  // // 2. check to see if the body is valid (https://rollbar.com/ryanhugh/searchneu/items/54/)
  // // Ex:
  // //   TypeError: Cannot read property '0' of undefined at line var messaging_events = req.body.entry[0].messaging;


  // const messaging_events = req.body.entry[0].messaging;
  // for (let i = 0; i < messaging_events.length; i++) {
  //   const event = req.body.entry[0].messaging[i];
  //   const sender = event.sender.id;
  //   if (event.message && event.message.text) {
  //     const text = event.message.text;

  //     if (text === 'test') {
  //       notifyer.sendFBNotification(sender, 'CS 1800 now has 1 seat avalible!! Check it out on https://searchneu.com/cs1800 !');
  //     } else {
  //       notifyer.sendFBNotification(sender, "Yo! 👋😃😆 I'm the Search NEU bot. Someday, I will notify you when seats open up in classes that are full. 😎👌🍩 But that day is not today...");
  //     }
  //   }
  // }
  // res.sendStatus(200);
});


let middleware;

if (macros.DEV) {
  const compiler = webpack(webpackConfig);
  middleware = webpackMiddleware(compiler, {
    publicPath: webpackConfig.output.publicPath,
    stats: {
      colors: true,
      timings: true,
      hash: false,
      chunksM: false,
      chunkModules: false,
      modules: false,
    },
  });

  app.use(middleware);
  app.use(webpackHotMiddleware(compiler));
}


app.use(express.static('public'));

// Google Search Console Site Verification.
// I could make this a static file... but it is never going to change so though this would be easier.
// If this is removed, the domain will no longer be verified with Google.
app.get('/google840b636639b40c3c.html', (req, res) => {
  res.write('google-site-verification: google840b636639b40c3c.html');
  res.end();
});

// Bing site authentication.
app.get('/BingSiteAuth.xml', (req, res) => {
  res.write('<?xml version="1.0"?>\n<users>\n  <user>8E6E97A65CAB89F73346E3E6DCE84142</user>\n</users>');
  res.end();
});

app.get('*', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=UTF-8');
  if (macros.PROD) {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
  } else {
    res.write(middleware.fileSystem.readFileSync(path.join(webpackConfig.output.path, 'index.html')));
    res.end();
  }
});


// your express error handler
app.use((err, req, res) => {
  // in case of specific URIError
  if (err instanceof URIError) {
    macros.log('Warning, could not process malformed url: ', req.url);
    return res.send('Invalid url.');
  }
  macros.error(err);
  return res.send(err);
});


let port;
if (macros.DEV) {
  port = 5000;
} else {
  port = 5000;
}


async function startServer() {
  const rollbarKey = await macros.getEnvVariable('rollbarPostServerItemToken');

  if (macros.PROD) {
    if (rollbarKey) {
      rollbar.init(rollbarKey);
      const rollbarFunc = rollbar.errorHandler(rollbarKey);

      // https://rollbar.com/docs/notifier/node_rollbar/
      // Use the rollbar error handler to send exceptions to your rollbar account
      app.use(rollbarFunc);
    } else {
      macros.error("Don't have rollbar key! Skipping rollbar. :O");
    }
  } else if (macros.DEV && !rollbarKey) {
    macros.log("Don't have rollbar key! Skipping rollbar. :O");
  }


  app.listen(port, '0.0.0.0', (err) => {
    if (err) {
      macros.log(err);
    }
    macros.log(`Listening on port ${port}.`);
  });
}
startServer();
