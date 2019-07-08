import parseMeetings from '../scrapers/classes/parsersxe/meetingParser';

import htlh2200 from './dataxe/getFacultyMeetingTimes/htlh2200.json';
import expectedHtlh2200 from './dataxe/getFacultyMeetingTimes/htlh2200.searchneu.json'

it('meetingParser.js', () => {
  expect(parseMeetings(htlh2200)).toEqual(expectedHtlh2200);
});
