/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import authentication from '../authentication';

it('should generate a login key', () => {
  expect(authentication.getLoginKey()).toMatchSnapshot();
});


it('should not crash', () => {
  const event = {
    event: 'opt_in',
  };

  authentication.onSendToMessengerClick(event);
});
