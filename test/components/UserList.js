import React from "react";
import {shallow} from "enzyme";
import assert from "assert";
import {UserList} from "../../src_users/components/common/UserList";

// unit tests for the UserList component
describe('UserList component', () => {
    describe('render()', () => {
        it('should render the progressbar', () => {
            const props = {
                page: 1,
                users: [],
                dispatch: () => {
                },
            }
            const wrapper = shallow(<UserList {...props} />);
            assert.equal(wrapper.find('ProgressBar').length, 1);
        });

        it('should render the users list', () => {
            const props = {
                page: 1,
                users: [
                    {
                        id: 1,
                        username: 'John',
                        job: 'CEO',
                    }
                ],
            }
            const wrapper = shallow(<UserList {...props} />);
            assert.equal(wrapper.find('Table').length, 1);
            assert.equal(wrapper.find('Pagination').length, 1);
        });
    });
});