import React from "react";
import {Link} from "react-router";
import {Button, Glyphicon} from "react-bootstrap";

// User List Element component
export default class UserListElement extends React.Component {
    // render
    render() {
        const {user, showDelete} = this.props;
        return (
            <tr>
                <td>#{user.id}</td>
                <td>{user.username}</td>
                <td>{user.job}</td>
                <td>
                    <Link to={'user-edit/' + user.id}>
                        <Button bsSize="xsmall">
                            Edit <Glyphicon glyph="edit"/>
                        </Button>
                    </Link>
                </td>
                <td>
                    <Button bsSize="xsmall" className="user-delete" onClick={() => showDelete(user)}>
                        Delete <Glyphicon glyph="remove-circle"/>
                    </Button>
                </td>
            </tr>
        );
    }
}

// prop checks
UserListElement.propTypes = {
  user: React.PropTypes.object.isRequired,
  showDelete: React.PropTypes.func.isRequired,
}