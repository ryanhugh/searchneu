/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import user from '../user';

it('should generate a login key', () => {
  expect(user.getLoginKey()).toMatchSnapshot();
});
