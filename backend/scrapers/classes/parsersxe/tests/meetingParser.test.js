import MeetingParser from '../meetingParser';

import data from './data/meetingParser.data';

it('meetingParser.js', () => {
  expect(MeetingParser.parseMeetings(data.htlh2200)).toMatchSnapshot();
});

it('profname', () => {
  expect(MeetingParser.profName({ displayName: 'Chu, Daj' })).toEqual('Daj Chu');
});
