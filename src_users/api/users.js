// API Users static class
export default class ApiUsers {
    // get a list of users
    static getList(action) {
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
                }
                resolve(users);
            }, timeout);
        });
    }

    // add a user
    static add(action) {
        // call some api url
    }

    // edit a user
    static edit(action) {
        // call some api url
    }

    // delete a user
    static delete(action) {
        // call some api url
    }
}