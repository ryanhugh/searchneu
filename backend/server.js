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

import Request from './scrapers/request';
import search from '../common/search';
import webpackConfig from './webpack.config.babel';
import macros from './macros';

const request = new Request('server');

const app = express();

// gzip the output
app.use(compress()); 

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Prevent being in an iFrame.
app.use(function (req, res, next) {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader("Content-Security-Policy", "frame-ancestors 'none'");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (macros.PROD) {
    // Assets are cached for a day. 
    // This time interval was chosen because the scrapers are ran daily, so there is no point for the browser to update the cache more often that this. 
    // These Cache-control headers are far from perfect though haha
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
  else {

    // Don't cache in DEV
    // Could also use no-store which would prevent the browser from storing it all.
    // This no-cache header requires the browser to revalidate the cache with the server before serving it.
    res.setHeader('Cache-Control', 'no-cache');
  }
  next()
}.bind(this))


// Http to https redirect. 
app.use(function (req, res, next) {
  
  var remoteIp = req.connection.remoteAddress;


  // If this is https request, done. 
  if (req.protocol === 'https') {
    next()
  }

  // If we are behind a cloudflare proxy and cloudflare served a https response, done. 
  else if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] === 'https') {
    next()
  }

  // This is development mode
  else if (macros.DEV) {
    next()
  }

  // This is prod and still on http, redirect to https. 
  else {
    // Cache the http to https redirect for 2 months. 
    res.setHeader('Cache-Control', 'public, max-age=5256000');
    macros.log(remoteIp, 'redirecting to https')
    res.redirect('https://' + req.get('host') + req.originalUrl);
  }
})


// Used for loading the data required to make the frontend work.
// This is just the data stored in public and not in cache.
// Tries to load from a local file and if that fails loads from https://searchneu.com
// And caches that locally.
async function getFrontendData(file) {

  let localPath = path.join('.', 'public', file)
  let exists = await fs.exists(localPath)

  // Exists locally, great
  if (exists) {
    let body = await fs.readFile(localPath)
    return JSON.parse(body)
  }

  macros.log("Downloading ", file, ' from searchneu.com becaues it does not exist locally.')

  // Download from https://searchneu.com
  // Note this goes through the local request cache
  let resp;
  try {
    resp = await request.get('https://searchneu.com/' + file)
  }
  catch (e) {
    macros.error('Unable to load frontend data from locally or from searchneu.com!', e);
    return null;
  }

  await mkdirp(path.dirname(localPath))

  // Save that locally
  await fs.writeFile(localPath, resp.body);

  return JSON.parse(resp.body);
}



let searchPromise = null;

async function getSearch() {
  if (searchPromise) {
    return searchPromise;
  }

  const termDumpPromise = getFrontendData('data/getTermDump/neu.edu/201810.json')

  const searchIndexPromise = getFrontendData('data/getSearchIndex/neu.edu/201810.json')

  const employeeMapPromise = getFrontendData('data/employeeMap.json');

  const employeesSearchIndexPromise = getFrontendData('data/employeesSearchIndex.json');

  try {
    searchPromise = Promise.all([termDumpPromise, searchIndexPromise, employeeMapPromise, employeesSearchIndexPromise]).then((...args) => {
      return search.create(...args[0]);
    });
  }
  catch (e) {
    macros.error("Error:", e)
    macros.error('Not starting search backend.')
    return null;
  }

  return searchPromise;
}

// Load the index as soon as the app starts. 
getSearch();

app.get('/search', wrap(async (req, res) => {
  if (!req.query.query || typeof req.query.query !== 'string' || req.query.query.length > 500) {
    macros.log('Need query.', req.query);
    res.send(JSON.stringify({
      error: 'Need query param.'
    }));
    return;
  }

  if (!macros.isNumeric(req.query.minIndex) || !macros.isNumeric(req.query.maxIndex)) {
    macros.log("Need numbers as max and min index.")
    res.send(JSON.stringify({
      error: "Max and Min index must be numbers."
    }))
    return;
  }

  let minIndex = 0;
  if (req.query.minIndex) {
    minIndex = parseInt(req.query.minIndex);
  }

  let maxIndex = 10;
  if (req.query.maxIndex) {
    maxIndex = parseInt(req.query.maxIndex);
  } 


  const index = await getSearch();

  if (!index) {

    // Don't cache errors.
    res.setHeader('Cache-Control', 'no-cache, no-store');
    res.send('Could not start backend. No data found.')
    return;
  }

  const startTime = Date.now();
  const results = index.search(req.query.query, minIndex, maxIndex);
  const midTime = Date.now();
  const string = JSON.stringify(results)
  macros.log(req.connection.remoteAddress, 'Search for', req.query.query, 'took ', midTime-startTime, 'ms and stringify took', Date.now()-midTime, 'with', results.length, 'results');

  // Set the header for application/json and send the data.
  res.setHeader("Content-Type", "application/json; charset=UTF-8");
  res.send(string);
}));



// Webhook to respond to facebook messages. 
async function sendTextMessage(sender, text) {
    console.log("Sending a fb message to ", sender, text)
    let messageData = { text:text }
    
    let token = await macros.getEnvVariable('fbToken')
    request.post({
	    url: 'https://graph.facebook.com/v2.6/me/messages',
	    qs: {access_token:token},
	    method: 'POST',
		json: {
		    recipient: {id:sender},
			message: messageData,
		}
	}, function(error, response, body) {
		if (error) {
		    macros.log('Error sending messages: ', error)
		} else if (response.body.error) {
		    macros.log('Error: ', response.body.error)
	    }
    })
}


// for Facebook verification of the endpoint.
app.get('/webhook/', async function (req, res) {
        macros.log(req.query);
        
        let verifyToken = await macros.getEnvVariable('fbVerifyToken')
        
        if (req.query['hub.verify_token'] === verifyToken) {
          macros.log("yup!");
          res.send(req.query['hub.challenge'])
        }
        else {
          res.send('Error, wrong token')
        }
})

// Respond to the messages
app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
	    let event = req.body.entry[0].messaging[i]
	    let sender = event.sender.id
	    if (event.message && event.message.text) {
		    let text = event.message.text
		    
		    if (text === 'test') {
  		    sendTextMessage(sender, "CS 1800 now has 1 seat avalible!! Check it out on https://searchneu.com/cs1800 !");
		    }
		    else {
  		    sendTextMessage(sender, "Yo! 👋😃😆 I'm the Search NEU bot. Someday, I will notify you when seats open up in classes that are full. 😎👌🍩 But that day is not today...");
		    }
	    }
    }
    res.sendStatus(200)
})



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

app.get('/sw.js', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'sw.js'));
});

// Google Search Console Site Verification. 
// I could make this a static file... but it is never going to change so though this would be easier. 
// If this is removed, the domain will no longer be verified with Google. 
app.get('/google840b636639b40c3c.html', (req, res) => {
  res.write('google-site-verification: google840b636639b40c3c.html')
  res.end();
})

app.get('*', (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=UTF-8");
  if (macros.PROD) {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  }
  else {
    res.write(middleware.fileSystem.readFileSync(path.join(webpackConfig.output.path, 'index.html')));
    res.end();
  }
});


let port;
if (macros.DEV) {
  port = 5000;
}
else {
  port = 80;
}


async function startServer() {
  const rollbarKey = await macros.getEnvVariable('rollbarPostServerItemToken');

  if (rollbarKey) {
    rollbar.init(rollbarKey);
    const rollbarFunc = rollbar.errorHandler(rollbarKey)

    // https://rollbar.com/docs/notifier/node_rollbar/
    // Use the rollbar error handler to send exceptions to your rollbar account
    app.use(rollbarFunc);
  }
  else {
    if (macros.PROD) {
      macros.error("Don't have rollbar key! Skipping rollbar. :O");
    }
    else {
      macros.log("Don't have rollbar key! Skipping rollbar. :O");
    }
  }

  app.listen(port, '0.0.0.0', (err) => {
    if (err) { 
      macros.log(err); 
    }
    console.info(`Listening on port ${port}.`);
  });

}
startServer();
