import React from 'react';
import { shallow } from 'enzyme';
import assert from 'assert';

import UserEditJob from '../../src_users/components/UserEditJob';

// unit tests for the UserEditJob component
describe('UserEditJob component', () => {
    describe('render()', () => {
        it('should render the component', () => {
            const props = {
                input: {},

            }
            const wrapper = shallow(<UserEditJob {...props} />);
            assert.equal(wrapper.find('FormGroup').length, 1);
            assert.equal(wrapper.find('Glyphicon').length, 1);
        });
    });
});