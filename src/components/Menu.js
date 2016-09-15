import React from 'react';
import { Nav, NavItem, Glyphicon } from 'react-bootstrap';
import { IndexLinkContainer, LinkContainer } from 'react-router-bootstrap';

/**
 * Menu component
 */
export default class Menu extends React.Component
{
    /**
     * Render
     *
     * @returns {XML}
     */
    render()
    {
        return(
            <Nav bsStyle="pills">
                <IndexLinkContainer to="/">
                    <NavItem>
                        Home
                    </NavItem>
                </IndexLinkContainer>
                <LinkContainer to="/user-edit">
                    <NavItem>
                        Add User <Glyphicon glyph="plus-sign"/>
                    </NavItem>
                </LinkContainer>
                <NavItem href="https://github.com/catalin-luntraru/redux-minimal" target="_blank">
                    redux-minimal
                </NavItem>
            </Nav>
        );
    }
}
