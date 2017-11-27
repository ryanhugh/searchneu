
import React from 'react';
import renderer from 'react-test-renderer';

import WeekdayBoxes from '../WeekdayBoxes';
import Section from '../../../../common/classModels/Section';
import mockData from './mockData';


it('should behave...', () => {
  const tree = renderer.create(<WeekdayBoxes section={ mockData.WMNS4520section } />);

  const json = tree.toJSON();

  // Not sure why, but this dosen't work yet.
  // Use Jest's snapshotting feature to ensure that the DOM does not change.
  // Jest saves these files in the __snapshots__ folder.
  expect(json).toMatchSnapshot();
});
