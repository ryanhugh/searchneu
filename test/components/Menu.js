import React from "react";
import {shallow} from "enzyme";
import assert from "assert";
import Menu from "../../src_users/components/common/Menu";

// unit tests for the Menu component
describe('Menu component', () => {
    describe('render()', () => {
        it('should render the component', () => {
            const wrapper = shallow(<Menu/>);
            assert.equal(wrapper.find('IndexLinkContainer').length, 1);
            assert.equal(wrapper.find('LinkContainer').length, 1);
            assert.equal(wrapper.find('NavItem').length, 3);
        });
    });
});