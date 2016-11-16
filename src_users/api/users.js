// API Users static class
export default class ApiUsers {
  // get a list of users
  static getList() {
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
      }, 1000);
    });
  }

  // add/edit a user
  static addEdit() {
    return new Promise(resolve => {
      setTimeout(() => {
        // do something here
        resolve();
      }, 1000);
    });
  }

  // delete a user
  static delete() {
    return new Promise(resolve => {
      setTimeout(() => {
        // do something here
        resolve();
      }, 500);
    });
  }
}
