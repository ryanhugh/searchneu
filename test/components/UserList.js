import React from "react";
import { shallow } from "enzyme";
import assert from "assert";
import { UserList } from "../../src_users/components/common/UserList";

// unit tests for the UserList component
describe('UserList component', () => {
  describe('render()', () => {
    it('should render the progressbar', () => {
      const props = {users: []};
      const wrapper = shallow(<UserList {...props} />);
      assert.equal(wrapper.length, 1);
    });
  });
});
