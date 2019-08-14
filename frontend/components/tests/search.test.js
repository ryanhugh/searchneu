/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

jest.mock('../request');

import search from '../search';
import requestMock from '../__mocks__/request';

import requestmock2 from '../request'


it('should do nothing', async (done) => {
  let results = await search.search('ben', '201850', 4);

  console.log(requestMock.get, requestmock2)
  done()
});
