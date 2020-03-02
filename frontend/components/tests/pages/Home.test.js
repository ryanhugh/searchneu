/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';

import Enzyme, { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import Home from '../../pages/Home';

jest.mock('react-router-dom', () => ({
  useHistory: () => ({
    push: jest.fn(),
  }),
  useParams: () => ({ termId:'202030' }),
}));

Enzyme.configure({ adapter: new Adapter() });

it('should render a section', () => {
  const result = shallow(<Home />);
  expect(result).toMatchSnapshot();
});
