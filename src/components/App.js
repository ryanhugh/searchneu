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
                    Built with {' '}
                    <a href="https://github.com/catalin-luntraru/react-redux-minimal-starter" target="_blank">
                        React Redux minimal boilerplate (starter kit)
                    </a>
                </div>
            </div>
        );
    }
}
