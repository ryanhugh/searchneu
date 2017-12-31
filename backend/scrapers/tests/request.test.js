/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import Request from '../request';

const request = new Request();

it('get should work', async (done) => {
  const response = await request.get('https://google.com');

  expect(response.body).toBe('response for GET https://google.com');

  done();
});


it('post should work', async (done) => {
  const response = await request.post('https://google.com');

  expect(response.body).toBe('response for POST https://google.com');

  done();
});

it('head should work', async (done) => {
  const response = await request.head('https://google.com');

  expect(response.body).toBe('response for HEAD https://google.com');

  done();
});
