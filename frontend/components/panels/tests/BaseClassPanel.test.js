/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

// import React from 'react';
// import renderer from 'react-test-renderer';

import mockData from './mockData';
import BaseClassPanel from '../BaseClassPanel';


it('should not render a button', () => {
  const instance = new BaseClassPanel({
    aClass: mockData.cs0210,
  });

  const button = instance.getShowMoreButton();

  expect(button).toMatchSnapshot();
});


it('should render a button', () => {
  const instance = new BaseClassPanel({
    aClass: mockData.cs1210,
  });

  const button = instance.getShowMoreButton();

  expect(button).toMatchSnapshot();
});
