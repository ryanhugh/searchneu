import React from 'react';
import Menu from './Menu';

/**
 * App component
 */
export default class App extends React.Component
{
    /**
     * Render
     *
     * @returns {XML}
     */
    render()
    {
        return (
            <div className="container">
                <div className="row">
                    <Menu/>
                </div>
                <div className="row">
                    {this.props.children}
                </div>
                <div className="row footer">
                    Simple users app built with {' '}
                    <a href="http://redux-minimal.js.org/" target="_blank">
                        redux-minimal
                    </a>
                </div>
            </div>
        );
    }
}
