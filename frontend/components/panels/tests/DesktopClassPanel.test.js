/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import MockDate from 'mockdate';

import mockData from './mockData';
import DesktopClassPanel from '../DesktopClassPanel';

beforeAll(() => {
  MockDate.set('Mon Nov 26 2017 00:00:00 -0000');
});

afterAll(() => {
  MockDate.reset();
});

it('should render some stuff', () => {
  const renderer = new ShallowRenderer();
  renderer.render(<DesktopClassPanel aClass={ mockData.cs1210 } />);
  const result = renderer.getRenderOutput();

  expect(result).toMatchSnapshot();
});

