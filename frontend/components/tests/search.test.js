/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

jest.mock('../request');

import search from '../search';
import requestMock from '../__mocks__/request';


// Importing this one will get the mocked out instance above. 
// If you directly import '../__mocks__/request' you will get a different instance of requestMock
import requestmock2 from '../request'


// beforeAll(() => {
//   MockDate.set('Mon Oct 10 2016 00:00:00 -0000');
// });

afterAll(() => {
  requestmock2.reset();
});


it('should do nothing', async (done) => {
	requestmock2.setBenResponse(false);
  let results = await search.search('ben', '201850', 4);

  console.log(results.results.length)

  requestmock2.setBenResponse(false);

  // results = await search.search('ben', '201850', 4);

  // console.log(results.results)

  console.log(requestmock2.get, requestmock2)
  done()
});
