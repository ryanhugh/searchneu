import React from "react";
import { shallow } from "enzyme";
import assert from "assert";
import { UserDeletePrompt } from "../../src_users/components/common/UserDeletePrompt";

// unit tests for the UserDeletePrompt component
describe('UserDeletePrompt component', () => {
  describe('render()', () => {
    it('should render the component', () => {
      const props = {
        modal_delete: {
          show: false,
          id: 0,
          username: '',
        }
      }
      const wrapper = shallow(<UserDeletePrompt {...props} />);
      assert.equal(wrapper.find('Modal').length, 1);
      assert.equal(wrapper.find('Button').length, 2);
    });
  });
});
