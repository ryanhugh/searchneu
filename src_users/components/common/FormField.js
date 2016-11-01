import React from "react";
import {FormGroup, ControlLabel, FormControl, HelpBlock, Row, Col} from "react-bootstrap";

// Form field component
export default class FormField extends React.Component {
    // prop checks
    static get propTypes() {
        return {
            meta: React.PropTypes.object,
            input: React.PropTypes.object,
            theme: React.PropTypes.string,  // 2col (default), etc
            validate: React.PropTypes.bool, // true or false
            label: React.PropTypes.string,  // the field text (empty string by default)
            componentClass: React.PropTypes.string, // input (by default), textarea, select
            type: React.PropTypes.string,   // input type: text (by default), password
        };
    }

    // render
    render() {
        if (this.props.validate) {
            return (
                <FormGroup
                    validationState={!this.props.meta.touched ? null : (this.props.meta.error ? 'error' : 'success')}>
                    {this.content()}
                    <FormControl.Feedback/>
                    <HelpBlock>{this.props.meta.touched && this.props.meta.error ? this.props.meta.error : null}</HelpBlock>
                </FormGroup>
            );
        } else {
            return (
                <FormGroup>
                    {this.content()}
                </FormGroup>
            );
        }
    }

    // the field content
    content() {
        if ('other_theme' === this.props.theme) {
            // layout for some other theme
        } else {
            // default theme: 2col
            return (
                <Row>
                    <Col sm={2}>{this.props.label}</Col>
                    <Col sm={10}>
                        <FormControl {...this.props.input} componentClass={this.props.componentClass}
                                     type={this.props.type}>
                            {this.props.children}
                        </FormControl>
                    </Col>
                </Row>
            );
        }
    }
}