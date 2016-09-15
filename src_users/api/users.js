/**
 * API Users static class
 * Normally you would call fetch() to access the api, but this dummy data is good for enough for our app
 */
export default class ApiUsers
{
    /**
     * Get a list of users
     *
     * @param action
     * @returns {Array}
     */
    static getList(action)
    {
        const timeout = 1000;   // 1 second delay
        return new Promise(resolve => {
            setTimeout(() => {
                // build some dummy users list
                let users = [];
                for (let x = 1; x <= 28; x++) {
                    users.push({
                        id: x,
                        username: 'Johny ' + x,
                        job: 'Employee ' + x,
                    });
                };
                resolve(users);
            }, timeout);
        });
    }

    /**
     * Add a user
     *
     * @param action
     */
    static add(action)
    {
        // call some api url
    }

    /**
     * Edit a user
     *
     * @param action
     */
    static edit(action)
    {
        // call some api url
    }

    /**
     * Delete a user
     *
     * @param action
     */
    static delete(action)
    {
        // call some api url
    }
}
