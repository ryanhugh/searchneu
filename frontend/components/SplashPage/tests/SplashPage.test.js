/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import renderer from 'react-test-renderer';

import SplashPage from '../SplashPage';

it('should render without crashing', () => {
  const tree = renderer.create(<SplashPage />);

  tree.toJSON();

  // No need to snapshot the Splash page.
  // Would just have to update the snapshot every time we changed something.
});
