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
  const { results } = await search.search('ben', '201850', {}, 4);

  expect(results.length).toBe(0);
  done();
});


it('should cache the results of a given search', async (done) => {
  const { results } = await search.search('ben', '201850', {}, 4);

  expect(results.length).toBe(4);

  const firstResults = _.cloneDeep(results);

  // Even though we disable the response, this search module should cache it.
  mockRequest.setBenResponse(false);

  const { results: secondResults } = await search.search('ben', '201850', {}, 4);

  expect(secondResults).toEqual(firstResults);

  expect(secondResults.length).toBe(4);

  done();
});


it('should fail if not given the right info', async (done) => {
  const { results: invalidTermIdResults } = await search.search('ben', '567898765', {}, 4);

  expect(invalidTermIdResults.length).toBe(0);

  const { results: alsoInvalidTermIdResults } = await search.search('ben', null, {}, 4);

  expect(alsoInvalidTermIdResults.length).toBe(0);

  done();
});


it('should be able to combine different lengths', async (done) => {
  const { results } = await search.search('ben', '201850', {}, 1);

  expect(results.length).toBe(1);

  const { results: moreResults } = await search.search('ben', '201850', {}, 4);

  // Make sure the original didn't change
  expect(results.length).toBe(1);

  // The new results should be 4 long
  expect(moreResults.length).toBe(4);

  // Make a request to hit cache
  mockRequest.setBenResponse(false);

  const { results: resultsThatHitCache } = await search.search('ben', '201850', {}, 4);

  expect(resultsThatHitCache).toEqual(moreResults);

  // Make sure the original didn't change
  expect(results.length).toBe(1);

  done();
});


//TODO: add tests w/ filters
