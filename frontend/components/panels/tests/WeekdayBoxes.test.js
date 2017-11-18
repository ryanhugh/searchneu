
import React from 'react';
import renderer from 'react-test-renderer';

import WeekdayBoxes from '../WeekdayBoxes';
import Section from '../../../../common/classModels/Section';


const section = Section.create({
  seatsCapacity: 5,
  seatsRemaining: 0,
  waitCapacity: 0,
  waitRemaining: 0,
  online: false,
  url: 'https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201810&crn_in=17445',
  crn: '17445',
  meetings: [
    {
      startDate: 17415,
      endDate: 17506,
      profs: ['Christopher S. Chambers'],
      where: 'Richards Hall 235',
      type: 'Class',
      times:
        {
          2: [
            {
              start: 48900,
              end: 54900,
            },
          ],
          5: [
            {
              start: 48900,
              end: 54900,
            },
          ],
        },
      allProfs: ['Christopher S. Chambers'],
    },
    {
      startDate: 17508,
      endDate: 17508,
      profs: ['Christopher S. Chambers'],
      where: 'Kariotis Hall 102',
      type: 'Final Exam',
      times:
        {
          5: [
            {
              start: 28800,
              end: 36000,
            },
          ],
        },
      allProfs: [
        'Christopher S. Chambers',
      ],
    },
  ],
  lastUpdateTime: 1510778472444,
  termId: '201810',
  host: 'neu.edu',
  subject: 'WMNS',
  classId: '4520',
  classUid: '4520_1145701999',
});


it('should behave...', () => {
  const tree = renderer.create(<WeekdayBoxes section={ section } />);

  const json = tree.toJSON();

  // Not sure why, but this dosen't work yet.
  // Use Jest's snapshotting feature to ensure that the DOM does not change.
  // Jest saves these files in the __snapshots__ folder.
  expect(json).toMatchSnapshot();
});
