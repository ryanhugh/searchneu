import React from "react";
import {shallow} from "enzyme";
import assert from "assert";
import Home from "../../src_users/components/Home";

// unit tests for the Home component
describe('Home component', () => {
    describe('render()', () => {
        it('should render the component', () => {
            const wrapper = shallow(<Home/>);
            assert.equal(wrapper.find('.page-home').length, 1);
        });
    });
});