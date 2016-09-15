import React from 'react';

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
                {this.props.children}
            </div>
        );
    }
}
