/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import renderer from 'react-test-renderer';

import Home from '../Home';

it('should render without crashing', () => {
  const tree = renderer.create(<Home />);

  tree.toJSON();

  // Not sure why, but this dosen't work yet.
  // Use Jest's snapshotting feature to ensure that the DOM does not change.
  // Jest saves these files in the __snapshots__ folder.
  // expect(json).toMatchSnapshot();
});
