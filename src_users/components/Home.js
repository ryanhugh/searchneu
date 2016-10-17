import React from 'react';

import UserList from './UserList';

/**
 * Home page component
 */
export default class Home extends React.Component
{
    /**
     * Render
     *
     * @returns {XML}
     */
    render()
    {
        return(
            <div className="page-home">
                <UserList/>
            </div>
        );
    }
}
