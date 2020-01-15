import parseMeetings from '../meetingParser';

import data from './data/meetingParser.data';

it('meetingParser.js', () => {
  expect(parseMeetings(data.htlh2200)).toMatchSnapshot();
});
