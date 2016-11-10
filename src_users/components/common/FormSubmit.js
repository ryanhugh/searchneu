import React from "react";
import {FormGroup, HelpBlock, Button} from "react-bootstrap";

// Form submit component
export default class FormSubmit extends React.Component {
    // prop checks
    static get propTypes() {
        return {
            error: React.PropTypes.string,  // redux-form general `_error` message
            invalid: React.PropTypes.bool,  // redux-form invalid prop
            submitting: React.PropTypes.bool,   // redux-form invalid submitting
            buttonSaveLoading: React.PropTypes.string, // save button loading text, default is "Saving..."
            buttonSave: React.PropTypes.string,    // save button text, default is "Save"
        };
    }

    // render
    render() {
        const {error, invalid, submitting, buttonSaveLoading, buttonSave} = this.props;
        return (
            <div>
                {error &&
                <FormGroup validationState="error">
                    <HelpBlock>{error}</HelpBlock>
                </FormGroup>}

                <FormGroup className="submit">
                    <Button type="submit" bsStyle="primary" disabled={invalid || submitting}>
                        {submitting ?
                            (buttonSaveLoading ? buttonSaveLoading : 'Saving...') :
                            (buttonSave ? buttonSave : 'Save')}
                    </Button>
                </FormGroup>
            </div>
        );
    }
}