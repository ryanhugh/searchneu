import React from 'react';
import { FormGroup, Col, InputGroup, FormControl, Glyphicon } from 'react-bootstrap';

/**
 * User edit job form field component
 */
export default class UserEditJob extends React.Component
{
    /**
     * Make sure we have all the props
     *
     * @returns {}
     */
    static get propTypes()
    {
        return {
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
            <FormGroup>
                <Col sm={2}>Job</Col>
                <Col sm={8}>
                    <InputGroup>
                        <FormControl {...this.props.input} id="job" type="text" placeholder="Job"/>
                        <InputGroup.Addon>
                            <Glyphicon glyph="briefcase"/>
                        </InputGroup.Addon>
                    </InputGroup>
                </Col>
            </FormGroup>
        );
    }
}