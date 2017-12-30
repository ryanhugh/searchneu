/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';

import Enzyme, { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import SignUpForNotifications from '../SignUpForNotifications';
import mockData from '../panels/tests/mockData';


Enzyme.configure({ adapter: new Adapter() });

beforeEach(() => {
  window.location.hash = '#fbtest';
});

afterEach(() => {
  window.location.hash = '#';
});

it('should render', () => {
  const result = shallow(<SignUpForNotifications aClass={ mockData.cs1210 } />);
  expect(result).toMatchSnapshot();
});


it('should render the fb button after the button is clicked', () => {
  const wrapper = shallow(<SignUpForNotifications aClass={ mockData.cs1210 } />);
  const instance = wrapper.instance();

  instance.onSubscribeToggleChange();

  wrapper.update();

  expect(wrapper).toMatchSnapshot();
});

