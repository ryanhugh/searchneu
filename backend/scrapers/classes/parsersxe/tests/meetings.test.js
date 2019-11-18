import parseMeetings from '../meetingParser';

import htlh2200 from './data/getFacultyMeetingTimes/htlh2200.json';

it('meetingParser.js', () => {
  expect(parseMeetings(htlh2200)).toMatchSnapshot();
});
