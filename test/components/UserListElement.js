import React from "react";
import { shallow } from "enzyme";
import assert from "assert";
import UserListElement from "../../src_users/components/common/UserListElement";

// unit tests for the UserListElement component
describe('UserListElement component', () => {
  describe('render()', () => {
    it('should render the component', () => {
      const props = {user: {}, showDelete: ()=>{}};
      const wrapper = shallow(<UserListElement {...props} />);
      assert.equal(wrapper.length, 1);
    });
  });
});
