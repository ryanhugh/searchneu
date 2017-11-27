/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';

import Enzyme, { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import macros from '../../macros';

import mockData from './mockData';
import EmployeePanel from '../EmployeePanel';

Enzyme.configure({ adapter: new Adapter() });

it('should render a desktop employee panel', () => {
  const orig = macros.isMobile;
  macros.isMobile = false;

  const result = shallow(<EmployeePanel employee={ mockData.razzaq } />);
  expect(result).toMatchSnapshot();

  macros.isMobile = orig;
});


it('should render a mobile employee panel', () => {
  const orig = macros.isMobile;
  macros.isMobile = true;

  const result = shallow(<EmployeePanel employee={ mockData.razzaq } />);
  expect(result).toMatchSnapshot();

  macros.isMobile = orig;
});
