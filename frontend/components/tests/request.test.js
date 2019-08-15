/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import request from '../request';
import MockXMLHttpRequest from './MockXMLHttpRequest';


const realXMLHttpRequest = window.XMLHttpRequest;

// Make sure to reset the mock request module after each test.
afterEach(() => {
  window.XMLHttpRequest = realXMLHttpRequest;
});

beforeEach(() => {
  window.XMLHttpRequest = MockXMLHttpRequest;
});


it('should work', async (done) => {
  const promise = request.get('/request');

  MockXMLHttpRequest.instance.respondToRequest(200, JSON.stringify('hi'));

  const response = await promise;

  expect(response).toBe('hi');

  done();
});


it('should error or something', async (done) => {
  // Retry times must be 1, because async.js doesn't play well with Jest
  const promise = request.get({ url: '/request', retryTimes: 1 });

  MockXMLHttpRequest.instance.respondToRequest(404, JSON.stringify('this is a 404'));

  try {
    await promise;
    expect(false);
  } catch (e) {
    expect(e.includes('this is a 404'));
    done();
  }

  done();
});


it('responds with a json error', async (done) => {
  // Retry times must be 1, because async.js doesn't play well with Jest
  const promise = request.get({ url: '/requestt' });

  MockXMLHttpRequest.instance.respondToRequest(200, JSON.stringify({ error: 'this is an error' }));

  const response = await promise;

  expect(MockXMLHttpRequest.instance.method).toBe('GET');

  expect(response.error).toBe('this is an error');


  done();
});


it('responds to a post', async (done) => {
  // Retry times must be 1, because async.js doesn't play well with Jest
  const promise = request.post({ url: '/postt', body: 'body here' });

  MockXMLHttpRequest.instance.respondToRequest(200, JSON.stringify({ someKey: 'some value' }));

  const response = await promise;

  expect(MockXMLHttpRequest.instance.method).toBe('POST');

  expect(response.someKey).toBe('some value');

  done();
});
