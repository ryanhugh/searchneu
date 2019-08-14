/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import _ from 'lodash';
import search from '../search';


// Importing this one will get the mocked out instance above.
// If you directly import '../__mocks__/request' you will get a different instance of requestMock
import mockRequest from '../request';

jest.mock('../request');


// Make sure to reset the mock request module after each test.
afterEach(() => {
  mockRequest.reset();
  search.clearCache();
});

beforeEach(() => {
  mockRequest.reset();
  search.clearCache();
});


it('should not have any results', async (done) => {
  mockRequest.setBenResponse(false);
  const results = await search.search('ben', '201850', 4);

  expect(results.results.length).toBe(0);
  done();
});


it('should cache the results of a given search', async (done) => {
  const results = await search.search('ben', '201850', 4);

  expect(results.results.length).toBe(4);

  const firstResults = _.cloneDeep(results.results);

  // Even though we disable the response, this search module should cache it.
  mockRequest.setBenResponse(false);

  const secondResults = await search.search('ben', '201850', 4);

  expect(secondResults.results).toEqual(firstResults);

  expect(secondResults.results.length).toBe(4);

  done();
});
