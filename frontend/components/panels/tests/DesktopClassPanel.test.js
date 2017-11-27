/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import MockDate from 'mockdate';
import Enzyme, { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import mockData from './mockData';
import DesktopClassPanel from '../DesktopClassPanel';

Enzyme.configure({ adapter: new Adapter() });

beforeAll(() => {
  MockDate.set('Mon Nov 26 2017 00:00:00 -0000');
});

afterAll(() => {
  MockDate.reset();
});

it('should render some stuff', () => {
  const wrapper = shallow(<DesktopClassPanel aClass={ mockData.cs1210 } />);
  expect(wrapper).toMatchSnapshot();
});

it('shouldShowWaitlist should work', () => {
  const wrapper = shallow(<DesktopClassPanel aClass={ mockData.cs1210 } />);
  const instance = wrapper.instance();

  expect(instance.shouldShowWaitlist()).toBe(false);
});

it('shouldShowWaitlist should work', () => {
  const wrapper = shallow(<DesktopClassPanel aClass={ mockData.cs0210 } />);
  const instance = wrapper.instance();

  expect(instance.shouldShowWaitlist()).toBe(true);
});
