/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import mockData from './mockData';
import DesktopSectionPanel from '../DesktopSectionPanel';

it('should render some stuff', () => {
  const renderer = new ShallowRenderer();
  renderer.render(<DesktopSectionPanel shouldShowExamColumns={ false } showWaitList={ false } section={ mockData.cs1210.sections[0] } />);
  const result = renderer.getRenderOutput();

  expect(result).toMatchSnapshot();
});

