/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import search from '../search';

jest.mock('../request');


it('should do nothing', async (done) => {
  let results = await search.search('ben', '201850', 4);

  console.log(results)
  done()
});
