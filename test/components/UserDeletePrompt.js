import React from "react";
import { shallow } from "enzyme";
import assert from "assert";
import UserDeletePrompt from "../../src_users/components/common/UserDeletePrompt";

// unit tests for the UserDeletePrompt component
describe('UserDeletePrompt component', () => {
  describe('render()', () => {
    it('should render the component', () => {
      const props = {show: true, user: {}, hideDelete: ()=>{}, userDelete: ()=>{}};
      const wrapper = shallow(<UserDeletePrompt {...props}/>);
      assert.equal(wrapper.length, 1);
    });
  });
});
