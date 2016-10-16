import React from 'react';
import { connect } from 'react-redux';
import { Modal, Button } from 'react-bootstrap';

/**
 * User delete component
 */
export class UserDelete extends React.Component
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
        this.modalDeleteHide = this.modalDeleteHide.bind(this);
        this.userDelete = this.userDelete.bind(this);
    }

    /**
     * Render
     *
     * @returns {XML}
     */
    render()
    {
        return (
            <Modal show={this.props.modal_delete.show}>
                <Modal.Header>
                    <Modal.Title>
                        Are you sure you want to delete <strong>{this.props.modal_delete.username}</strong>?
                    </Modal.Title>
                </Modal.Header>
                <Modal.Footer>
                    <Button onClick={this.modalDeleteHide}>No</Button>
                    <Button bsStyle="primary" onClick={this.userDelete}>Yes</Button>
                </Modal.Footer>
            </Modal>
        );
    }

    /**
     * Close the delete modal
     *
     * @param event
     */
    modalDeleteHide(event)
    {
        this.props.dispatch({
            type: 'USERS_MODAL_DELETE_HIDE',
        });
    }

    /**
     * Delete a user
     *
     * @param event
     */
    userDelete(event)
    {
        // delete the user with the api
        this.props.dispatch({
            type: 'USERS_DELETE_SAVE',
            id: this.props.modal_delete.id,
        });

        // delete the user from the state
        this.props.dispatch({
            type: 'USERS_DELETE',
            id: this.props.modal_delete.id, // taken from the modal state
        });

        // hide the modal
        this.props.dispatch({
            type: 'USERS_MODAL_DELETE_HIDE',
        });
    }
}

// export the connected class
function mapStateToProps(state) {
    return {
        modal_delete: (state.users.modal && state.users.modal.list_delete) ? state.users.modal.list_delete : {
            show: false,
            id: 0,
            username: '',
        },
    };
}
export default connect(mapStateToProps)(UserDelete);
