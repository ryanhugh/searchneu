/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import renderer from 'react-test-renderer';
import ShallowRenderer from 'react-test-renderer/shallow';


import mockData from './mockData';
import DesktopClassPanel from '../DesktopClassPanel';


// it('should render some stuff', function() {

  const myrenderer = new ShallowRenderer();
  myrenderer.render(<DesktopClassPanel aClass={mockData.cs1210} />);
  const result = myrenderer.getRenderOutput();

  // console.log(result)



    // const component = renderer.create(<DesktopClassPanel aClass={mockData.cs1210} />);
    debugger

    // let tree = component.toJSON()
console.log(result)
    expect(result).toMatchSnapshot();


// });