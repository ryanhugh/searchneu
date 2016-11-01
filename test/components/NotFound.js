import React from "react";
import {shallow} from "enzyme";
import assert from "assert";
import NotFound from "../../src_users/components/NotFound";

// unit tests for the NotFound component
describe('NotFound component', () => {
    describe('render()', () => {
        it('should render the component', () => {
            const wrapper = shallow(<NotFound/>);
            assert.equal(wrapper.find('.page-not-found').length, 1);
        });
    });
});