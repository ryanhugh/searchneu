import React from "react";
import {shallow} from "enzyme";
import assert from "assert";
import {UserEdit} from "../../src_users/components/UserEdit";

// unit tests for the UserEdit component
describe('UserEdit component', () => {
    describe('render()', () => {
        it('should render the add user form', () => {
            const props = {
                initialValues: {
                    id: 0,
                },
                handleSubmit: () => {
                },
                invalid: true,
                submitting: false,
            }
            const wrapper = shallow(<UserEdit {...props} />);
            assert.equal(wrapper.find('.page-user-edit').length, 1);
            assert.equal(wrapper.find('PageHeader').children().text(), 'User add');
            assert.equal(wrapper.find('Button').prop('disabled'), true);
        });

        it('should render the edit user form', () => {
            const props = {
                initialValues: {
                    id: 1,
                },
                handleSubmit: () => {
                },
                invalid: false,
                submitting: false,
            }
            const wrapper = shallow(<UserEdit {...props} />);
            assert.equal(wrapper.find('.page-user-edit').length, 1);
            assert.equal(wrapper.find('PageHeader').children().text(), 'User edit');
            assert.equal(wrapper.find('Button').prop('disabled'), false);
        });
    });
});