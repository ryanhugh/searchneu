import React from "react";
import {Modal, Button} from "react-bootstrap";

// User delete component
export default class UserDelete extends React.Component {
    // render
    render() {
        const {show, user, hideDelete, userDelete} = this.props;
        return (
            <Modal show={show}>
                <Modal.Header>
                    <Modal.Title>
                        Are you sure you want to delete <strong>{user.username}</strong>?
                    </Modal.Title>
                </Modal.Header>
                <Modal.Footer>
                    <Button onClick={hideDelete}>No</Button>
                    <Button bsStyle="primary" onClick={userDelete}>Yes</Button>
                </Modal.Footer>
            </Modal>
        );
    }
}

// prop checks
UserDelete.propTypes = {
  show: React.PropTypes.bool.isRequired,
  user: React.PropTypes.object.isRequired,
  hideDelete: React.PropTypes.func.isRequired,
  userDelete: React.PropTypes.func.isRequired,
}