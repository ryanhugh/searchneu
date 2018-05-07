/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';

import Enzyme, { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import mockData from './mockData';
import WeekdayBoxes from '../WeekdayBoxes';

Enzyme.configure({ adapter: new Adapter() });


it('should render a section', () => {
  const result = shallow(<WeekdayBoxes section={ mockData.WMNS4520section } />);

  // Use Jest's snapshotting feature to ensure that the DOM does not change.
  // Jest saves these files in the __snapshots__ folder.
  expect(result).toMatchSnapshot();
});


it('should render another section', () => {
  const result = shallow(<WeekdayBoxes section={ mockData.cs0210.sections[0] } />);
  expect(result).toMatchSnapshot();
});

it('should not render a section if it\'s online', () => {
  const result = shallow(<WeekdayBoxes section={{ online: true }} />);

  expect(result.html()).toBe(null);
});
