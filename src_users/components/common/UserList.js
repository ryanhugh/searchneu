import React from "react";
import {connect} from "react-redux";
import {push} from "react-router-redux";
import {ProgressBar, Table, Pagination} from "react-bootstrap";
import UserListElement from "./UserListElement";
import UserDelete from "./UserDelete";

// User list component
export class UserList extends React.Component {
    // constructor
    constructor(props) {
        super(props);

        // when we don't have any users, update the state with the users list taken from the api
        if (0 === this.props.users.length) {
            this.props.dispatch({type: 'USERS_FETCH_LIST'});
        }

        // bind <this> to the event method
        this.changePage = this.changePage.bind(this);
    }

    // render
    render() {
        // pagination
        const per_page = 10;
        const pages = Math.ceil(this.props.users.length / per_page);
        const current_page = this.props.page;
        const start_offset = (current_page - 1) * per_page;
        let start_count = 0;

        // render
        if (this.props.users.length) {
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
                        {this.props.users.map((user, index) => {
                            if (index >= start_offset && start_count < per_page) {
                                start_count++;
                                return (
                                    <UserListElement key={user.id} id={user.id}/>
                                );
                            }
                        })}
                        </tbody>
                    </Table>

                    <Pagination className="users-pagination pull-right" bsSize="medium" maxButtons={10} first last next
                                prev boundaryLinks items={pages} activePage={current_page} onSelect={this.changePage}/>

                    <UserDelete/>
                </div>
            );
        } else {
            // show the loading state
            return (
                <ProgressBar active now={100}/>
            );
        }
    }

    // change the user lists' current page
    changePage(page) {
        this.props.dispatch(push('/?page=' + page));
    }
}

// export the connected class
function mapStateToProps(state) {
    return {
        users: state.users.list || [],

        // https://github.com/reactjs/react-router-redux#how-do-i-access-router-state-in-a-container-component
        // react-router-redux wants you to get the url data by passing the props through a million components instead of
        // reading it directly from the state, which is basically why you store the url data in the state (to have access to it)
        page: Number(state.routing.locationBeforeTransitions.query.page) || 1,
    };
}
export default connect(mapStateToProps)(UserList);