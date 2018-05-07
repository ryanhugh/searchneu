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
    ref: 'eyJjbGFzc0hhc2giOiJuZXUuZWR1LzIwMTkxMC9DUy8wMTQxIiwic2VjdGlvbkhhc2hlcyI6W10sImRldiI6dHJ1ZSwibG9naW5LZXkiOiI2RlBNN0l0RGgxdEQ3ZlpIT29aNnBLbnF5bER3aU9OMlc5UG9YelVNbFdEdFVYMzFXd0lLcWxWWTk3VUl5QzE2Rmo1cVhIMnFYeXQwUHJ5TXdKOHR2VTJseG41T2xqZnhtdWlPIn0',
  };

  authentication.onSendToMessengerClick(event);
});
