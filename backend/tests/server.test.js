/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */


import app from '../server';

// By default, jest will replace the build in 'request' module with the mock of frontend/components/request.js.
// This is relevant because 'request-promise-native' calls require('request') under the hood.
// Lets have it require the real 'request' library, and not the frontend mock.
jest.unmock('request');

const request = jest.requireActual('request-promise-native');

let server = null;

beforeAll((done) => {
  server = app.listen(6789, done);
});

afterAll((done) => {
  server.close(done);
});

it('should work', async (done) => {

  const result = await request({
    url:'http://localhost:6789/search',
    followAllRedirects: false,
  });

  expect(!!JSON.parse(result).error).toBe(true);

  done();
});
