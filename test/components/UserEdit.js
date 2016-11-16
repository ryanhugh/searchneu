import React from "react";
import { shallow } from "enzyme";
import assert from "assert";
import { UserEdit } from "../../src_users/components/UserEdit";

// unit tests for the UserEdit component
describe('UserEdit component', () => {
  describe('render()', () => {
    it('should render the add user form', () => {
      const props = {user: {}, handleSubmit: ()=>{}};
      const wrapper = shallow(<UserEdit {...props} />);
      assert.equal(wrapper.length, 1);
    });
  });
});
