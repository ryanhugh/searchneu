import React from 'react';
import Enzyme, { mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

Enzyme.configure({ adapter: new Adapter() });

const TestHook = ({ callback }) => {
  callback();
  return null;
};

export default function (callback) {
  mount(<TestHook callback={ callback } />);
}
