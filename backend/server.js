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
import compress from 'compression';
import rollbar from 'rollbar';
import bodyParser from 'body-parser';
import moment from 'moment';
import xhub from 'express-x-hub';
import atob from 'atob';
import _ from 'lodash';
import elastic from './elastic';

import Request from './scrapers/request';
import webpackConfig from './webpack.config.babel';
import macros from './macros';
import notifyer from './notifyer';
import Updater from './updater';
import database from './database';
import graphql from './graphql';

// This file manages every endpoint in the backend
// and calls out to respective files depending on what was called

const request = new Request('server');

const app = express();

// This xhub code is responsible for verifying that requests that hit the /webhook endpoint are from facebook in production
// This does some crypto stuff to make this verification
// This way, only facebook can make calls to the /webhook endpoint
// This is not used in development
const fbAppSecret = macros.getEnvVariable('fbAppSecret');


// All of the requests/responses that haven't been pushed yet. Added here when
// requests come in for data that isn't quite in the backend yet
// saved as loginKey: {res, timeStamp}.
// Timestamp is the output of Date.now().
// getUserDataReqs are cleared after 3 seconds
const getUserDataReqs = {};

// The minimum amount of time in milliseconds user data reqs are held before
// they are elgible for cleanup.
const MAX_HOLD_TIME_FOR_GET_USER_DATA_REQS = 3000;

// The interval id that fires when user data reqs are awaiting cleanup.
let getUserDataInterval = null;

// Start updater interval
Updater.create();

// Verify that the webhooks are coming from facebook
// This needs to be above bodyParser for some reason
app.use(xhub({ algorithm: 'sha1', secret: fbAppSecret }));

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

  if (req.connection.remoteAddress !== '127.0.0.1') {
    output.push('remoteIp: ');
    output.push(req.connection.remoteAddress);
  }

  return output.join('');
}


// This is more complicated than just req.connection.remoteAddress (which will always be 127.0.0.1)
// because this Node.js server is running behind both nginx and Cloudflare.
// This will return the IP of the user connecting to the site
// Because there are two step between us and the user,
// we need to check the second the last item in the x-forwarded-for header.
// We shouldn't check the first item in the header, because someone could send a forged x-forwarded-for header
// that would be added to the beginning of the x-forwarded-for that is received here.
function getRemoteIp(req) {
  if (req.headers['cf-connecting-ip']) {
    return req.headers['cf-connecting-ip'];
  }

  if (macros.PROD) {
    // macros.warn('No cf-connecting-ip?', req.headers, req.connection.remoteAddress);
    return '';
  }

  const forwardedForHeader = req.headers['x-forwarded-for'];

  if (!forwardedForHeader) {
    if (macros.PROD) {
      macros.warn('No forwardedForHeader?', req.headers, req.connection.remoteAddress);
    }

    return req.connection.remoteAddress;
  }

  const splitHeader = forwardedForHeader.split(',');

  // Cloudflare sometimes sends health check requests
  // which will only have 1 item in this header
  if (splitHeader.length === 1) {
    macros.warn('Only have one item in the header?', forwardedForHeader);
    return splitHeader[0].trim();
  }


  if (splitHeader.length > 2) {
    macros.log('Is someone sending a forged header?', forwardedForHeader);
  }

  return splitHeader[splitHeader.length - 2].trim();
}

// Gets the current time, just used for loggin
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

graphql.applyMiddleware({ app: app });

app.get('/search', wrap(async (req, res) => {
  if (macros.DEV && !await elastic.isConnected()) {
    const fromProd = await request.get(`https://searchneu.com${req.originalUrl}`);
    res.send(fromProd.body);
    macros.log('In dev mode and Elasticsearch not available. Hitting production search API endpoint');
    return;
  }

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

  let filters = {};
  if (req.query.filters) {
    // Ensure filters is a string
    if (typeof req.query.filters !== 'string') {
      macros.log('Invalid filters.', req.filters);
      res.send(JSON.stringify({
        error: 'Invalid filters.',
      }));
    } else {
      try {
        filters = JSON.parse(req.query.filters);
      } catch (e) {
        macros.log('Invalid filters JSON.', req.filters);
        res.send(JSON.stringify({
          error: 'Invalid filters.',
        }));
      }
    }
  }

  const { searchContent, took, resultCount } = await elastic.search(req.query.query, req.query.termId, req.query.minIndex, req.query.maxIndex, filters);
  const midTime = Date.now();

  let string;
  if (req.query.apiVersion === '2') {
    string = JSON.stringify({ results: searchContent });
  } else {
    string = JSON.stringify(searchContent);
  }

  // Not sure I am logging all the necessary analytics
  const analytics = {
    searchTime: took,
    stringifyTime: Date.now() - midTime,
    resultCount: resultCount,
  };

  macros.logAmplitudeEvent('Backend Search', analytics);

  macros.log(getTime(), getIpPath(req), 'Search for', req.query.query, 'from', minIndex, 'to', maxIndex, 'took', took, 'ms and stringify took', Date.now() - midTime, 'with', analytics.resultCount, 'results');

  // Set the header for application/json and send the data.
  res.setHeader('Content-Type', 'application/json; charset=UTF-8');
  res.send(string);
}));


// for Facebook verification of the endpoint.
app.get('/webhook/', (req, res) => {
  const verifyToken = macros.getEnvVariable('fbVerifyToken');

  if (req.query['hub.verify_token'] === verifyToken) {
    macros.log('yup!');
    res.send(req.query['hub.challenge']);
  } else {
    res.send('Error, wrong token');
  }
});

async function onSendToMessengerButtonClick(sender, userPageId, b64ref) {
  macros.log('Got opt in button click!', b64ref);

  if (macros.DEV && !await elastic.isConnected()) {
    macros.log('In dev mode and Elasticsearch not available. Class watching does not work. To fix this, make sure Elasticsearch is running on your computer and then run "yarn scrape" and "yarn index"');
    return;
  }

  // The frontend send a classHash to follow and a list of sectionHashes to follow.
  let userObject = {};
  try {
    userObject = JSON.parse(atob(b64ref));
  } catch (e) {
    macros.error('Unable to parse user data from frontend?', b64ref);
    return;
  }

  // When the site is running in development mode,
  // and the send to messenger button is clicked,
  // Facebook will still send the webhooks to prod
  // Keep another field on here to keep track of whether the button was clicked in prod or in dev
  // and if it was in dev ignore it
  if (userObject.dev && macros.PROD) {
    return;
  }

  if (!userObject.classHash || !userObject.sectionHashes || !userObject.loginKey) {
    macros.error('Invalid user object from webhook ', userObject);
    return;
  }

  if (typeof userObject.loginKey !== 'string' || userObject.loginKey.length !== 100) {
    macros.error('Invalid login key', userObject.loginKey);
    return;
  }

  macros.log('Got webhook - received ', userObject);
  // TODO: check that sender is a string and not a number
  const existingData = await database.get(sender);

  const aClass = (await elastic.get(elastic.CLASS_INDEX, userObject.classHash)).class;

  // User is signing in from a new device
  if (existingData) {
    macros.log('User found in db', existingData);
    // Add this array if it dosen't exist. It should exist
    if (!existingData.watchingClasses) {
      existingData.watchingClasses = [];
    }

    if (!existingData.watchingSections) {
      existingData.watchingSections = [];
    }

    const wasWatchingClass = existingData.watchingClasses.includes(userObject.classHash);

    const sectionWasentWatchingBefore = [];

    for (const section of userObject.sectionHashes) {
      if (!existingData.watchingSections.includes(section)) {
        sectionWasentWatchingBefore.push(section);
      }
    }

    const classCode = `${aClass.subject} ${aClass.classId}`;
    // Check to see how many of these classes they were already signed up for.
    if (wasWatchingClass && sectionWasentWatchingBefore.length === 0) {
      notifyer.sendFBNotification(sender, `You are already signed up to get notifications if any of the sections of ${classCode} have seats that open up. Toggle the sliders back on https://searchneu.com to adjust notifications!`);
    } else if (wasWatchingClass && sectionWasentWatchingBefore.length > 0) {
      // This should never run, because
      // 1) This flow only runs for classes with 0 or 1 sections
      // 2) It isn't possible to sign up for notification for a class but no sections in the class for classes that have sections
      // 3) Given that, the user must be signed up for the only section in the class too.
      // 4) And if there is only 1 section, there can't be any more sections to sign up for
      macros.warn('User signed up for more sections through the webhook?', userObject, existingData);
      notifyer.sendFBNotification(sender, `You are already signed up to get notifications if seats open up in some of the sections in ${classCode} and are now signed up for ${sectionWasentWatchingBefore.length} more sections too!`);
    } else if (sectionWasentWatchingBefore.length === 0) {
      notifyer.sendFBNotification(sender, `Successfully signed up for notifications if sections are added to ${classCode}!`);
    } else {
      // Same here
      macros.warn('User signed up for more sections through the webhook?', userObject, existingData);
      notifyer.sendFBNotification(sender, `Successfully signed up for notifications for ${sectionWasentWatchingBefore.length} sections in ${classCode}. Toggle the sliders back on https://searchneu.com to adjust notifications!`);
    }

    // Only add if it dosen't already exist in the user data.
    if (!existingData.watchingClasses.includes(userObject.classHash)) {
      existingData.watchingClasses.push(userObject.classHash);
    }

    existingData.watchingSections = _.uniq(existingData.watchingSections.concat(userObject.sectionHashes));

    // Remove any null or undefined values from the watchingClasses and watchingSections
    // This can happen if data is manually deleted from the DB, and the data is no longer continuous.
    // (eg index 0 is deleted and Google keeps the others at index 1 and index 2, so index 0 just contains undefined)
    if (existingData.watchingClasses.includes(undefined) || existingData.watchingSections.includes(undefined)) {
      macros.log('existing data class hashes or section hashes includes undefined!', existingData.watchingClasses, existingData.watchingSections);
    }

    if (existingData.watchingClasses.includes(null) || existingData.watchingSections.includes(null)) {
      macros.log('existing data class hashes or section hashes includes null!', existingData.watchingClasses, existingData.watchingSections);
    }

    _.pull(existingData.watchingClasses, null);
    _.pull(existingData.watchingClasses, undefined);

    _.pull(existingData.watchingSections, null);
    _.pull(existingData.watchingSections, undefined);


    // Add the login key to the array of login keys stored on this user
    if (!existingData.loginKeys) {
      existingData.loginKeys = [];
    }

    const loginKeys = new Set(existingData.loginKeys);
    loginKeys.add(userObject.loginKey);
    existingData.loginKeys = Array.from(loginKeys);
    if (getUserDataReqs[userObject.loginKey]) {
      macros.log('In webhook, responding to matching f request');
      getUserDataReqs[userObject.loginKey].res.send((JSON.stringify({
        status: 'Success',
        user: existingData,
      })));

      delete getUserDataReqs[userObject.loginKey];
    } else {
      macros.log('in webhook, did not finding matching f request ');
    }

    database.set(sender, existingData);
  } else {
    let names = await notifyer.getUserProfileInfo(sender);
    if (!names || !names.first_name) {
      macros.warn('Unable to get name', names);
      names = {};
    } else {
      macros.log('Got first name and last name', names.first_name, names.last_name);
    }

    const newUser = {
      watchingSections: userObject.sectionHashes,
      watchingClasses: [userObject.classHash],
      firstName: names.first_name,
      lastName: names.last_name,
      facebookMessengerId: sender,
      facebookPageId: userPageId,
      loginKeys: [userObject.loginKey],
    };

    macros.log('Adding ', newUser, 'to the db');

    // Send the user a notification letting them know everything was successful.
    const classCode = `${aClass.subject} ${aClass.classId}`;
    if (userObject.sectionHashes.length === 0) {
      // Don't mention the sliders here because there are only sliders if there are sections.
      notifyer.sendFBNotification(sender, `Thanks for signing up for notifications ${names.first_name}. Successfully signed up for notifications if sections are added to ${classCode}!`);
    } else {
      // Mention the sliders because there are sections.
      notifyer.sendFBNotification(sender, `Successfully signed up for notifications for ${userObject.sectionHashes.length} sections in ${classCode}. Toggle the sliders back on https://searchneu.com to adjust notifications!`);
    }

    database.set(sender, newUser);
    if (getUserDataReqs[userObject.loginKey]) {
      macros.log('In webhook, responding to matching f request');
      getUserDataReqs[userObject.loginKey].res.send((JSON.stringify({
        status: 'Success',
        user: newUser,
      })));

      delete getUserDataReqs[userObject.loginKey];
    } else {
      macros.log('in webhook, did not finding matching f request ');
    }
  }
}

// TODO: maybe there should be delete functionality?
async function unsubscribeSender(sender) {
  const existingData = await database.get(sender);

  if (existingData) {
    existingData.watchingClasses = [];
    existingData.watchingSections = [];
    macros.log('Unsubscribed ', sender, ' from everything.');
    database.set(sender, existingData);
  } else {
    macros.log("Didn't unsubscribe ", sender, ' from anything because they were not in the database');
  }

  notifyer.sendFBNotification(sender, "You've been unsubscribed from everything! Free free to re-subscribe to updates on https://searchneu.com");
}

// In production, this is called from Facebook's servers.
// When a user sends a Facebook messsage to the Search NEU bot or when someone hits the send to messenger button.
// If someone sends a message to this bot it will respond with some hard-coded responses
// In development, this is called directly from the frontend so the backend will do the same actions as it would in prod for the same user actions in the frontend.
// Facebook will still call the webhook on the production server when the send to messenger button is clicked in dev. This webhook call is ignored in prod.
app.post('/webhook/', wrap(async (req, res) => {
  // Verify that the webhook is actually coming from Facebook.
  // This is important.
  if ((!req.isXHub || !req.isXHubValid()) && macros.PROD) {
    macros.log(getTime(), getIpPath(req), 'Tried to send a webhook');
    macros.log(req.headers);
    res.send('nope');
    return;
  }

  // Check to see if the body is valid (https://rollbar.com/ryanhugh/searchneu/items/54/)
  if (!req.body || !req.body.entry || req.body.entry.length === 0) {
    macros.log('Invalid body on webhook?', req.body);
    res.send('nope');
    return;
  }

  // Now process the message.
  const messagingEvents = req.body.entry[0].messaging;
  for (let i = 0; i < messagingEvents.length; i++) {
    const event = messagingEvents[i];
    const sender = event.sender.id;
    if (event.message && event.message.text) {
      const text = event.message.text;

      if (text === 'test') {
        notifyer.sendFBNotification(sender, 'CS 1800 now has 1 seat available!! Check it out on https://searchneu.com/cs1800 !');
      } else if (text.toLowerCase() === 'stop') {
        unsubscribeSender(sender);
      } else if (text === 'What is my facebook messenger sender id?') {
        notifyer.sendFBNotification(sender, sender);
      } else if (text === 'no u' || text === 'no you') {
        notifyer.sendFBNotification(sender, 'no u');
      } else {
        // Don't send anything if the user sends a message.
        // notifyer.sendFBNotification(sender, "Yo! 👋😃😆 I'm the Search NEU bot. I will notify you when seats open up in classes that are full. Sign up on https://searchneu.com !");
      }
    } else if (event.optin) {
      onSendToMessengerButtonClick(sender, req.body.entry[0].id, event.optin.ref);

      // We should allways respond with a 200 status code, even if there is an error on our end.
      // If we don't we risk being unsubscribed for webhook events.
      // https://developers.facebook.com/docs/messenger-platform/webhook
      res.send(JSON.stringify({
        status: 'OK',
      }));
      return;
    } else {
      macros.log('Unknown webhook', sender, JSON.stringify(event), JSON.stringify(req.body));
    }
  }
  res.sendStatus(200);
}));


// finds the user with the login key that's been requested
// if the user doesn't exist, return
async function findMatchingUser(requestLoginKey) {
  return database.getByLoginKey(requestLoginKey);
}

// sends data to the database in the backend
async function verifyRequestAndGetDbUser(req, res) {
  // Don't cache this endpoint.
  res.setHeader('Cache-Control', 'no-cache, no-store');


  // if there's no body in the request, well, we'll crash, so let's not
  if (!req.body || !req.body.loginKey) {
    return null;
  }

  // Checks checks checks
  // Make sure the login key is valid
  if (typeof req.body.loginKey !== 'string' || req.body.loginKey.length !== 100) {
    macros.log('Invalid login key', req.body.loginKey);
    return null;
  }

  const senderId = req.body.senderId;

  // Ensure sender id exists and is valid.
  if (!senderId || typeof senderId !== 'string' || senderId.length !== 16 || !macros.isNumeric(senderId)) {
    macros.log('Invalid senderId', req.body, senderId);
    return null;
  }

  // Get the user from the db.
  const user = await database.get(senderId);
  if (!user) {
    macros.log(`Didn't find valid user from client request: ${JSON.stringify(user)}`, req.body.loginKey);
    return null;
  }

  // Verify the loginkey
  if (!user.loginKeys.includes(req.body.loginKey)) {
    macros.log(`Login Key's didn't match: ${JSON.stringify(user.loginKeys, null, 4)}`, req.body.loginKey);
    return null;
  }

  return user;
}


app.post('/addSection', wrap(async (req, res) => {
  if (!req.body.sectionHash || typeof req.body.sectionHash !== 'string') {
    res.send(JSON.stringify({
      error: 'Error.',
    }));
    return;
  }

  const userObject = await verifyRequestAndGetDbUser(req, res);

  if (!userObject) {
    macros.log('Invalid request', req.body);
    res.send(JSON.stringify({
      error: 'Error.',
    }));
    return;
  }

  const sectionHash = req.body.sectionHash;

  // Early exit if user is already watching this section.
  if (userObject.watchingSections.includes(sectionHash)) {
    macros.log('User was already watching section', userObject);
    res.send(JSON.stringify({
      status: 'Success',
    }));
    return;
  }

  userObject.watchingSections.push(sectionHash);

  await database.set(req.body.senderId, userObject);
  macros.log('sending done, section added. User:', userObject);

  // If the request also contains the notif data, we can send a notification to the user.
  // TODO: If it ever becomes possible to look up a section in elastic by sectionHash, we can have this
  // api only accept sectionHash and just look this info up in the DB.
  const notifData = req.body.notifData;

  if (notifData) {
    if (!notifData.subject || typeof notifData.subject !== 'string') {
      res.send(JSON.stringify({
        warning: 'Unable to send notification.',
      }));
      return;
    }

    if (!notifData.classId || typeof notifData.classId !== 'string') {
      res.send(JSON.stringify({
        warning: 'Unable to send notification.',
      }));
      return;
    }

    if (!notifData.crn || typeof notifData.crn !== 'string') {
      res.send(JSON.stringify({
        warning: 'Unable to send notification.',
      }));
      return;
    }


    notifyer.sendFBNotification(req.body.senderId, `Thanks for signing up for a section in ${notifData.subject} ${notifData.classId} (CRN: ${notifData.crn})!`);
  }


  // Send a status of success.
  res.send(JSON.stringify({
    status: 'Success',
  }));
}));

app.post('/removeSection', wrap(async (req, res) => {
  const userObject = await verifyRequestAndGetDbUser(req, res);

  if (!userObject) {
    macros.log('Invalid request', req.body);
    res.send(JSON.stringify({
      error: 'Error.',
    }));
    return;
  }

  const sectionHash = req.body.sectionHash;

  // Early exit if user is not watching this section.
  if (!userObject.watchingSections.includes(sectionHash)) {
    res.send(JSON.stringify({
      status: 'Success',
    }));
    return;
  }

  _.pull(userObject.watchingSections, sectionHash);

  await database.set(req.body.senderId, userObject);
  macros.log('sending done, section removed.');


  const notifData = req.body.notifData;

  if (notifData) {
    if (!notifData.subject || typeof notifData.subject !== 'string') {
      res.send(JSON.stringify({
        warning: 'Unable to send notification.',
      }));
      return;
    }

    if (!notifData.classId || typeof notifData.classId !== 'string') {
      res.send(JSON.stringify({
        warning: 'Unable to send notification.',
      }));
      return;
    }

    if (!notifData.crn || typeof notifData.crn !== 'string') {
      res.send(JSON.stringify({
        warning: 'Unable to send notification.',
      }));
      return;
    }

    notifyer.sendFBNotification(req.body.senderId, `You have unsubscribed from notifications for a section of ${notifData.subject} ${notifData.classId} (CRN: ${notifData.crn}).`);
  }

  res.send(JSON.stringify({
    status: 'Success',
  }));
}));


app.post('/addClass', wrap(async (req, res) => {
  const userObject = await verifyRequestAndGetDbUser(req, res);

  if (!userObject) {
    macros.log('Invalid request', req.body);
    res.send(JSON.stringify({
      error: 'Error.',
    }));
    return;
  }

  const classHash = req.body.classHash;

  if (!classHash || typeof classHash !== 'string') {
    res.send(JSON.stringify({
      error: 'Error.',
    }));
    return;
  }

  // Early exit if user is already watching this section.
  if (userObject.watchingClasses.includes(classHash)) {
    res.send(JSON.stringify({
      status: 'Success',
    }));
    return;
  }

  userObject.watchingClasses.push(classHash);

  await database.set(req.body.senderId, userObject);
  macros.log('sending done, class added. User is now:', userObject);

  const notifData = req.body.notifData;

  if (notifData) {
    if (!notifData.subject || typeof notifData.subject !== 'string') {
      res.send(JSON.stringify({
        warning: 'Unable to send notification.',
      }));
      return;
    }

    if (!notifData.classId || typeof notifData.classId !== 'string') {
      res.send(JSON.stringify({
        warning: 'Unable to send notification.',
      }));
      return;
    }

    notifyer.sendFBNotification(req.body.senderId, `You have subscribed to notifications for the class ${notifData.subject} ${notifData.classId}`);
  }

  // send a status of success. Hopefully it went well.
  res.send(JSON.stringify({
    status: 'Success',
  }));
}));


// cleans up old requests that are more than 10 seconds old.
function cleanOldGetUserDataReqs() {
  macros.log('cleaning up old getUserDataReqs', Object.keys(getUserDataReqs));

  const now = Date.now();

  for (const loginKey of Object.keys(getUserDataReqs)) {
    // Purge all entries over 3s old
    if (now - getUserDataReqs[loginKey].timeStamp > MAX_HOLD_TIME_FOR_GET_USER_DATA_REQS) {
      getUserDataReqs[loginKey].res.send(JSON.stringify({
        error: 'Request timed out',
      }));

      delete getUserDataReqs[loginKey];
      macros.log('cleaned out loginKey req', loginKey);
    }
  }

  // If they are all gone, stop the interval
  if (Object.keys(getUserDataReqs).length === 0) {
    clearInterval(getUserDataInterval);
    getUserDataInterval = null;
  }
}


function addToUserDataReqs(loginKey, res) {
  if (getUserDataReqs[loginKey]) {
    // Respond with a warning instead of an error
    // because we don't need the frontend to invalidate the loginKey and sender id if this happens.
    getUserDataReqs[loginKey].res.send(JSON.stringify({
      warning: 'Warning, multiple requests from the same user in quick succession',
    }));
  }
  getUserDataReqs[loginKey] = {
    res: res,
    timeStamp: Date.now(),
  };

  // Start the interval if it isn't already running
  if (!getUserDataInterval) {
    getUserDataInterval = setInterval(cleanOldGetUserDataReqs, MAX_HOLD_TIME_FOR_GET_USER_DATA_REQS / 4);
  }
}


app.post('/getUserData', wrap(async (req, res) => {
  // Don't cache this endpoint.
  res.setHeader('Cache-Control', 'no-cache, no-store');

  if (!req.body || !req.body.loginKey) {
    res.send(JSON.stringify({
      error: 'Error.',
    }));
    return;
  }

  // Checks checks checks
  // Make sure the login key is valid
  if (typeof req.body.loginKey !== 'string' || req.body.loginKey.length !== 100) {
    macros.log('Invalid login key', req.body.loginKey);
    res.send(JSON.stringify({
      error: 'Error.',
    }));
    return;
  }


  const senderId = req.body.senderId;

  // If the sender is given, make sure it is valid
  if (senderId && (typeof senderId !== 'string' || senderId.length !== 16 || !macros.isNumeric(senderId))) {
    macros.log('Invalid senderId', req.body, senderId);
    res.send(JSON.stringify({
      error: 'Error.',
    }));
    return;
  }

  let matchingUser;

  // If the client specified a specific senderId, lookup that specific user.
  // if not, we have to loop over all the users's to find a matching loginKey

  if (senderId) {
    const user = await database.get(senderId);

    // Don't do long polling when the the sender id is given
    // and the user doesn't exist in the db because
    // the only time this would happen is if the data was cleared out of the db.
    if (!user) {
      macros.log('User with senderId not in database yet', senderId);
      res.send(JSON.stringify({
        error: 'Error.',
      }));
      return;
    }

    // Ensure that a loginKey matches
    if (!user.loginKeys.includes(req.body.loginKey)) {
      macros.log('Invalid loginKey', senderId, req.body.loginKey, user);
      res.send(JSON.stringify({
        error: 'Error.',
      }));
      return;
    }

    matchingUser = user;
    if (!matchingUser.watchingSections) {
      matchingUser.watchingSections = [];
    }

    if (!matchingUser.watchingClasses) {
      matchingUser.watchingClasses = [];
    }
  } else {
    matchingUser = await findMatchingUser(req.body.loginKey);

    if (!matchingUser) {
      // Hang onto the request for a bit in case the webhook comes in shortly.
      addToUserDataReqs(req.body.loginKey, res);
      return;
    }
  }

  res.send(JSON.stringify({
    status: 'Success',
    user: matchingUser,
  }));
}));

// Rate-limit submissions on a per-IP basis
let rateLimit = {};
let lastHour = 0;

app.post('/submitFeedback', wrap(async (req, res) => {
  // Don't cache this endpoint.
  res.setHeader('Cache-Control', 'no-cache, no-store');

  if (!req.body.message) {
    macros.log('Empty message?');
    res.send(JSON.stringify({
      error: 'Need message.',
    }));
    return;
  }

  const userIp = getRemoteIp(req);

  const currentHour = String(parseInt(Date.now() / (1000 * 60 * 60), 10));

  // Clear out the rate limit once per hour
  // Do this instead of a timer because the vast majority of the time people are not going to be submitting
  // submissions, and this works just as well.
  if (lastHour !== currentHour) {
    lastHour = currentHour;
    rateLimit = {};
  }


  if (!rateLimit[userIp]) {
    rateLimit[userIp] = 0;
  }

  // Max ten submissions per hour
  if (rateLimit[userIp] >= 10) {
    res.send({
      error: 'Rate limit reached. Please wait an hour before submitting again.',
    });

    return;
  }

  rateLimit[userIp]++;

  let message = `Feedback form submitted: ${req.body.message}`;

  if (req.body.contact) {
    message += ` | ${req.body.contact}`;
  }


  // Ryan's User ID for the Search NEU in facebook.
  // In order to send Ryan a FB message with this ID you would need the secret key for the Search NEU page
  const response = await notifyer.sendFBNotification('1397905100304615', message);

  // Also send a message to Da-Jin
  const response2 = await notifyer.sendFBNotification('2289421987761573', message);

  if (response.error || response2.error) {
    macros.log(response.error, response2.error);
    res.send(JSON.stringify({
      error: 'Error.',
    }));
  } else {
    res.send(JSON.stringify({
      status: 'Success.',
    }));
  }
}));

// This variable is also used far below to serve static files from ram in dev
let middleware;

if (macros.DEV) {
  const compiler = webpack(webpackConfig);
  middleware = webpackMiddleware(compiler, {
    publicPath: webpackConfig.output.publicPath,
    logLevel: 'silent',
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
  app.use(webpackHotMiddleware(compiler, {
    log: false,
  }));
}


// Respond to requests for the api and log info to amplitude.
app.get('/data/*', wrap(async (req, res, next) => {
  // Gather some info and send it to amplitude
  const info = { ...req.headers };

  info.ip = getRemoteIp(req);
  info.url = req.url;

  macros.logAmplitudeEvent('API Request', info);

  // Use express to send the static file
  express.static('public')(req, res, next);
}));


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
// Express handles functions with four arguments as error handlers and functions with 3 arguments as middleware
// Add the eslint comment to keep all the args.
app.use((err, req, res, next) => { //eslint-disable-line no-unused-vars
  // in case of specific URIError
  if (err instanceof URIError) {
    macros.log('Warning, could not process malformed url: ', req.url);
    return res.send('Invalid url.');
  }
  macros.error(err);
  return res.send(err);
});

// If this port is ever changed we would also need to update the port in Facebook's whitelisted_domains
let port;
if (macros.DEV) {
  port = 5000;
} else {
  port = 5000;
}


const rollbarKey = macros.getEnvVariable('rollbarPostServerItemToken');

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

  macros.logAmplitudeEvent('Backend Server startup', {});

  macros.log(`Listening on port ${port}.`);
});
