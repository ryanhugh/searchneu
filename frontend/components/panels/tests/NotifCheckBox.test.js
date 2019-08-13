/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import Enzyme, { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import mockData from './mockData';
import NotifCheckBox from '../NotifCheckBox';

Enzyme.configure({ adapter: new Adapter() });

it('render the default notification checkbox', () => {
  const result = shallow(<NotifCheckBox section={ mockData.cs1210.sections[0] } />);
  expect(result).toMatchSnapshot();
});

it('render the read only notification checkbox', () => {
  const result = shallow(<NotifCheckBox section={ mockData.cs1210.sections[1] } />);
  expect(result).toMatchSnapshot();
});
