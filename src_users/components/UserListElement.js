import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { Button, Glyphicon } from 'react-bootstrap';

/**
 * User List Element component
 */
class UserListElement extends React.Component
{
    /**
     * Constructor
     *
     * @param props
     */
    constructor(props)
    {
        super(props);

        // bind <this> to the event method
        this.modalDeleteShow = this.modalDeleteShow.bind(this);
    }

    /**
     * Render
     *
     * @returns {XML}
     */
    render()
    {
        // get the user element data
        let user;
        for (const val of this.props.users) {
            if (val.id === Number(this.props.own_props.id)) {
                user = val;
                break;
            }
        }

        // render
        return (
            <tr>
                <td>#{user.id}</td>
                <td>{user.username}</td>
                <td>{user.job}</td>
                <td>
                    <Link to={'user-edit/'+user.id}>
                        <Button bsSize="xsmall">
                            Edit <Glyphicon glyph="edit"/>
                        </Button>
                    </Link>
                </td>
                <td>
                    <Button bsSize="xsmall" className="user-delete" data-id={user.id} data-username={user.username}
                        onClick={this.modalDeleteShow}>
                        Delete <Glyphicon glyph="remove-circle"/>
                    </Button>
                </td>
            </tr>
        );
    }

    /**
     * Prompt to delete the user
     *
     * @param event
     */
    modalDeleteShow(event)
    {
        const user_id = Number(event.target.dataset.id);
        const username = event.target.dataset.username;
        this.props.dispatch({
            type: 'users.modalDeleteShow',
            id: user_id,
            username: username,
        });
    }
}

// make sure we have all the props
UserListElement.propTypes = {
    id: React.PropTypes.number.isRequired,
}

// export the connected class
function mapStateToProps(state, own_props) {
    return {
        users: state.users.list || [],
        own_props: own_props,
    }
}
export default connect(mapStateToProps)(UserListElement);
