import React from "react";
import { connect } from "react-redux";
import { push } from "react-router-redux";
import { Table, Pagination } from "react-bootstrap";
import UserListElement from "./UserListElement";
import UserDeletePrompt from "./UserDeletePrompt";

// User list component
export class UserList extends React.Component {
  // constructor
  constructor(props) {
    super(props);

    // default ui local state
    this.state = {
      delete_show: false,
      delete_user: {},
    };

    // bind <this> to the event method
    this.changePage = this.changePage.bind(this);
    this.showDelete = this.showDelete.bind(this);
    this.hideDelete = this.hideDelete.bind(this);
    this.userDelete = this.userDelete.bind(this);
  }

  // render
  render() {
    // pagination
    const {users, page} = this.props;
    const per_page = 10;
    const pages = Math.ceil(users.length / per_page);
    const start_offset = (page - 1) * per_page;
    let start_count = 0;

    // show the list of users
    return (
      <div>
        <Table bordered hover responsive striped>
          <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Job</th>
            <th>Edit</th>
            <th>Delete</th>
          </tr>
          </thead>
          <tbody>
          {users.map((user, index) => {
            if (index >= start_offset && start_count < per_page) {
              start_count++;
              return (
                <UserListElement key={index} user={user} showDelete={this.showDelete}/>
              );
            }
          })}
          </tbody>
        </Table>

        <Pagination className="users-pagination pull-right" bsSize="medium" maxButtons={10} first last next
          prev boundaryLinks items={pages} activePage={page} onSelect={this.changePage}/>

        <UserDeletePrompt show={this.state.delete_show} user={this.state.delete_user}
          hideDelete={this.hideDelete} userDelete={this.userDelete}/>
      </div>
    );
  }

  // change the user lists' current page
  changePage(page) {
    this.props.dispatch(push('/?page=' + page));
  }

  // show the delete user prompt
  showDelete(user) {
    // change the local ui state
    this.setState({
      delete_show: true,
      delete_user: user,
    });
  }

  // hide the delete user prompt
  hideDelete() {
    // change the local ui state
    this.setState({
      delete_show: false,
      delete_user: {},
    });
  }

  // delete the user
  userDelete() {
    // delete the user
    this.props.dispatch({
      type: 'USERS_DELETE',
      user_id: this.state.delete_user.id,
    });

    // hide the prompt
    this.hideDelete();
  }
}

// export the connected class
function mapStateToProps(state) {
  return {
    users: state.users,

    // https://github.com/reactjs/react-router-redux#how-do-i-access-router-state-in-a-container-component
    // react-router-redux wants you to get the url data by passing the props through a million components instead of
    // reading it directly from the state, which is basically why you store the url data in the state (to have access to it)
    page: Number(state.routing.locationBeforeTransitions.query.page) || 1,
  };
}
export default connect(mapStateToProps)(UserList);
