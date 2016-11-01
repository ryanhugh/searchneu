import React from "react";
import {shallow} from "enzyme";
import assert from "assert";
import {UserListElement} from "../../src_users/components/common/UserListElement";

// unit tests for the UserListElement component
describe('UserListElement component', () => {
    describe('render()', () => {
        it('should render the component', () => {
            const props = {
                id: 1,
                users: [
                    {
                        id: 1,
                        username: 'John',
                        job: 'CEO',
                    }
                ],
            }
            const wrapper = shallow(<UserListElement {...props} />);
            assert.equal(wrapper.find('td').length, 5);
            assert.equal(wrapper.find('Button').length, 2);
        });
    });
});