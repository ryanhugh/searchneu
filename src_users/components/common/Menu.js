import React from "react";
import { Nav, NavItem, Glyphicon } from "react-bootstrap";
import { IndexLinkContainer, LinkContainer } from "react-router-bootstrap";

// Menu component
export default class Menu extends React.Component {
  // render
  render() {
    return (
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
        <NavItem href="http://redux-minimal.js.org/" target="_blank">
          redux-minimal
        </NavItem>
      </Nav>
    );
  }
}
