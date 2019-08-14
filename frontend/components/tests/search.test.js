/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

jest.mock('../request');

import _ from 'lodash'
import search from '../search';
import requestMock from '../__mocks__/request';


// Importing this one will get the mocked out instance above.
// If you directly import '../__mocks__/request' you will get a different instance of requestMock
import requestmock2 from '../request'


// Make sure to reset the mock request module after each test. 
afterEach(() => {
  requestmock2.reset();
  search.clearCache();
});

beforeEach(() => {
  requestmock2.reset();
  search.clearCache();
});


it('should not have any results', async (done) => {
	requestmock2.setBenResponse(false);
  let results = await search.search('ben', '201850', 4);

  expect(results.results.length).toBe(0);
  done();
})


it('should cache the results of a given search', async (done) => {
  let results = await search.search('ben', '201850', 4);

  expect(results.results.length).toBe(4);

  let firstResults = _.cloneDeep(results.results)

  // Even though we disable the response, this search module should cache it. 
  requestmock2.setBenResponse(false);

  let secondResults = await search.search('ben', '201850', 4);

  expect(secondResults.results).toEqual(firstResults)

  expect(secondResults.results.length).toBe(4);

  done()
});
