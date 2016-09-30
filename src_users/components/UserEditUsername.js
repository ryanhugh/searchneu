import React from 'react';
import { FormGroup, Col, FormControl, HelpBlock } from 'react-bootstrap';

/**
 * User edit username form field component
 */
export default class UserEditUsername extends React.Component
{
    /**
     * Make sure we have all the props
     *
     * @returns {}
     */
    static get propTypes()
    {
        return {
            meta: React.PropTypes.object,
            input: React.PropTypes.object,
        };
    }

    /**
     * Render
     *
     * @returns {XML}
     */
    render()
    {
        return(
            <FormGroup validationState={!this.props.meta.touched ? null : (this.props.meta.error ? 'error' : 'success')}>
                <Col sm={2}>Username</Col>
                <Col sm={8}>
                    <FormControl {...this.props.input} id="username" type="text" placeholder="Username"/>
                    <FormControl.Feedback/>
                    <HelpBlock>{this.props.meta.touched && this.props.meta.error ? this.props.meta.error : null}</HelpBlock>
                </Col>
            </FormGroup>
        );
    }
}