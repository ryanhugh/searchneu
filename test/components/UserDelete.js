import React from "react";
import {shallow} from "enzyme";
import assert from "assert";
import {UserDelete} from "../../src_users/components/common/UserDelete";

// unit tests for the UserDelete component
describe('UserDelete component', () => {
    describe('render()', () => {
        it('should render the component', () => {
            const props = {
                modal_delete: {
                    show: false,
                    id: 0,
                    username: '',
                }
            }
            const wrapper = shallow(<UserDelete {...props} />);
            assert.equal(wrapper.find('Modal').length, 1);
            assert.equal(wrapper.find('Button').length, 2);
        });
    });
});