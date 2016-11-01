import React from "react";
import {connect} from "react-redux";
import {goBack} from "react-router-redux";
import {Field, reduxForm} from "redux-form";
import {PageHeader, Form, FormGroup, Col, Button} from "react-bootstrap";
import FormField from "./common/FormField";

// User add/edit page component
export class UserEdit extends React.Component {
    // current form type: add or edit
    form_type;

    // constructor
    constructor(props) {
        super(props);

        // set the current form type
        this.form_type = (props.initialValues.id > 0) ? 'edit' : 'add';

        // bind <this> to the event method
        this.formSubmit = this.formSubmit.bind(this);
    }

    // render
    render() {
        return (
            <div className="page-user-edit">
                <PageHeader>{'edit' === this.form_type ? 'User edit' : 'User add'}</PageHeader>
                <Form horizontal onSubmit={this.props.handleSubmit(this.formSubmit)}>
                    <Field component={FormField} name="username" label="Username" validate={true}/>
                    <Field component={FormField} name="job" label="Job"/>

                    <FormGroup>
                        <Col smOffset={2} sm={8}>
                            <Button type="submit" disabled={this.props.invalid || this.props.submitting}>
                                Save User
                            </Button>
                        </Col>
                    </FormGroup>
                </Form>
            </div>
        );
    }

    // submit the form
    formSubmit(values) {
        // add/edit the user in the api
        const upper_form_type = this.form_type.toUpperCase();   // ADD or EDIT
        this.props.dispatch({
            type: 'USERS_' + upper_form_type + '_SAVE',
            id: values.id,
            username: values.username,
            job: values.job,
        });

        // add/edit the user in the state
        this.props.dispatch({
            type: 'USERS_' + upper_form_type,
            id: values.id,
            username: values.username,
            job: values.job,
        });

        // redirect to home page
        this.props.dispatch(goBack());  // bug: if the history is empty then it will go to an empty page
    }
}

// decorate the form component
const UserEditForm = reduxForm({
    form: 'user_edit',
    validate: function (values) {
        const errors = {};
        if (!values.username) {
            errors.username = 'Username is required';
        }
        return errors;
    },
})(UserEdit);

// export the connected class
function mapStateToProps(state, own_props) {
    // set the form data
    let form_data = {
        id: 0,
        username: '',
        job: '',
    };
    for (const user of state.users.list) {
        if (user.id === Number(own_props.params.id)) {
            form_data = user;
            break;
        }
    }

    // pass the state values
    return {
        initialValues: form_data,
    };
}
export default connect(mapStateToProps)(UserEditForm);