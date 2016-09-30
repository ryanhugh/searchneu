import React from 'react';
import { shallow } from 'enzyme';
import assert from 'assert';

import UserEditUsername from '../../src_users/components/UserEditUsername';

// unit tests for the UserEditUsername component
describe('UserEditUsername component', () => {
    describe('render()', () => {
        it('should render the component in the initial state', () => {
            const props = {
                meta: {
                    touched: false,
                },
                input: {},

            }
            const wrapper = shallow(<UserEditUsername {...props} />);
            assert.equal(wrapper.find('FormGroup').length, 1);
            assert.equal(wrapper.find('FormGroup').prop('validationState'), null);
            assert.equal(wrapper.find('HelpBlock').children().length, 0);   // empty text
        });

        it('should render the component in the error state', () => {
            const props = {
                meta: {
                    touched: true,
                    error: 'Required',
                },
                input: {},

            }
            const wrapper = shallow(<UserEditUsername {...props} />);
            assert.equal(wrapper.find('FormGroup').length, 1);
            assert.equal(wrapper.find('FormGroup').prop('validationState'), 'error');
            assert.equal(wrapper.find('HelpBlock').children().text(), 'Required');
        });

        it('should render the component in the success state', () => {
            const props = {
                meta: {
                    touched: true,
                },
                input: {},

            }
            const wrapper = shallow(<UserEditUsername {...props} />);
            assert.equal(wrapper.find('FormGroup').length, 1);
            assert.equal(wrapper.find('FormGroup').prop('validationState'), 'success');
            assert.equal(wrapper.find('HelpBlock').children().length, 0);   // empty text
        });
    });
});