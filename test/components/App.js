import React from "react";
import { shallow } from "enzyme";
import assert from "assert";
import App from "../../src_users/components/App";

// unit tests for the App component
describe('App component', () => {
  describe('render()', () => {
    it('should render the component', () => {
      const wrapper = shallow(<App/>);
      console.log(wrapper);
      assert.equal(wrapper.find('.container').length, 1);
      assert.equal(wrapper.find('.footer a').length, 1);
    });
  });
});
