import React from 'react';
import { connect } from 'react-redux';
import { goBack } from 'react-router-redux';
import { Field, reduxForm } from 'redux-form';
import { PageHeader, Form, FormGroup, Col, FormControl, InputGroup, Glyphicon, Button, HelpBlock } from 'react-bootstrap';

/**
 * User add/edit page component
 */
class UserEdit extends React.Component
{
    // Current form type: add or edit
    form_type;

    /**
     * Constructor
     *
     * @param props
     */
    constructor(props)
    {
        super(props);

        // set the current form type
        this.form_type = (props.initialValues.id > 0) ? 'edit' : 'add';

        // bind <this> to the event method
        this.formSubmit = this.formSubmit.bind(this);
    }

    /**
     * Render
     *
     * @returns {XML}
     */
    render()
    {
        return(
            <div className="page-user-edit">
                <PageHeader>{'edit' === this.form_type ? 'User edit' : 'User add'}</PageHeader>
                <Form horizontal onSubmit={this.props.handleSubmit(this.formSubmit)}>
                    <Field name="username" component={UserEdit.renderUsername}/>
                    <Field name="job" component={UserEdit.renderJob}/>
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

    /**
     * Render the username form field
     * http://redux-form.com/6.0.2/docs/api/Field.md/
     *
     * @param props
     * @returns {XML}
     */
    static renderUsername(props)
    {
        return (
            <FormGroup validationState={!props.meta.touched ? null : (props.meta.error ? 'error' : 'success')}>
                <Col sm={2}>Username</Col>
                <Col sm={8}>
                    <FormControl {...props.input} id="username" type="text" placeholder="Username"/>
                    <FormControl.Feedback/>
                    <HelpBlock>{props.meta.touched && props.meta.error ? props.meta.error : null}</HelpBlock>
                </Col>
            </FormGroup>
        );
    }

    /**
     * Render the job form field
     *
     * @param props
     * @returns {XML}
     */
    static renderJob(props)
    {
        return (
            <FormGroup>
                <Col sm={2}> Job</Col>
                <Col sm={8}>
                    <InputGroup>
                        <FormControl {...props.input} id="job" type="text" placeholder="Job"/>
                        <InputGroup.Addon>
                            <Glyphicon glyph="briefcase"/>
                        </InputGroup.Addon>
                    </InputGroup>
                </Col>
            </FormGroup>
        );
    }

    /**
     * Submit the form
     *
     * @param values
     */
    formSubmit(values)
    {
        // add/edit the user in the api
        const upper_form_type = this.form_type.charAt(0).toUpperCase() + this.form_type.slice(1);
        this.props.dispatch({
            type: 'users' + upper_form_type,  // Add or Edit
            id: values.id,
            username: values.username,
            job: values.job,
        });

        // add/edit the user in the state
        this.props.dispatch({
            type: 'users.' + this.form_type,  // add or edit
            id: values.id,
            username: values.username,
            job: values.job,
        });

        // redirect to home page
        this.props.dispatch(goBack());  // bug: if the history is empty then it will go to an empty page
    }
}

// decorate the form component
UserEdit = reduxForm({
    form: 'user_edit',
    validate: function(values){
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
export default connect(mapStateToProps)(UserEdit);
