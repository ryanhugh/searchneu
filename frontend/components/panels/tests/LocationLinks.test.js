/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';

import Enzyme, { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import mockData from './mockData';
import LocationLinks from '../LocationLinks';

Enzyme.configure({ adapter: new Adapter() });


it('should render a section', () => {
  const result = shallow(<LocationLinks section={ mockData.cs1210.sections[0] } />);
  expect(result).toMatchSnapshot();
});


it('should render another section', () => {
  const result = shallow(<LocationLinks section={ mockData.cs0210.sections[0] } />);
  expect(result).toMatchSnapshot();
});
