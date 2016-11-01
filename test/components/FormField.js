import React from "react";
import {shallow} from "enzyme";
import assert from "assert";
import FormField from "../../src_users/components/common/FormField";

// unit tests for the FormField component
describe('FormField component', () => {
    describe('render()', () => {
        it('should render the component in the initial state', () => {
            const props = {
                meta: {
                    touched: false,
                },
                input: {},

            }
            const wrapper = shallow(<FormField {...props} />);
            assert.equal(wrapper.find('FormGroup').length, 1);
            assert.equal(wrapper.find('FormGroup').prop('validationState'), undefined);
            assert.equal(wrapper.find('HelpBlock').length, 0);
        });

        it('should render the component in the initial state with validation', () => {
            const props = {
                meta: {
                    touched: false,
                },
                input: {},
                validate: true,

            }
            const wrapper = shallow(<FormField {...props} />);
            assert.equal(wrapper.find('FormGroup').length, 1);
            assert.equal(wrapper.find('FormGroup').prop('validationState'), null);
            assert.equal(wrapper.find('HelpBlock').children().length, 0);   // empty text
        });

        it('should render the component in the error state with validation', () => {
            const props = {
                meta: {
                    touched: true,
                    error: 'Required',
                },
                input: {},
                validate: true,

            }
            const wrapper = shallow(<FormField {...props} />);
            assert.equal(wrapper.find('FormGroup').length, 1);
            assert.equal(wrapper.find('FormGroup').prop('validationState'), 'error');
            assert.equal(wrapper.find('HelpBlock').children().text(), 'Required');
        });

        it('should render the component in the success state with validation', () => {
            const props = {
                meta: {
                    touched: true,
                },
                input: {},
                validate: true,

            }
            const wrapper = shallow(<FormField {...props} />);
            assert.equal(wrapper.find('FormGroup').length, 1);
            assert.equal(wrapper.find('FormGroup').prop('validationState'), 'success');
            assert.equal(wrapper.find('HelpBlock').children().length, 0);   // empty text
        });
    });
});