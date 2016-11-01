import assert from "assert";
import users from "../../src_users/reducers/users";

// unit tests for the users reducers
// mocha - http://mochajs.org/#getting-started
// assert - https://nodejs.org/api/assert.html#assert_assert_deepequal_actual_expected_message
describe('Users reducer', () => {
    describe('USERS_ADD', () => {
        it('should return a new user array element', () => {
            assert.deepEqual(
                users({
                    list: [
                        {
                            id: 1,
                            username: 'Some name',
                            job: 'Some job',
                        }
                    ]
                }, {
                    type: 'USERS_ADD',
                    id: 2,
                    username: 'Other name',
                    job: 'Other job',
                }), {
                    list: [
                        {
                            id: 1,
                            username: 'Some name',
                            job: 'Some job',
                        }, {
                            id: 2,
                            username: 'Other name',
                            job: 'Other job',
                        }
                    ]
                }
            );
        });
    });

    describe('USERS_EDIT', () => {
        it('should return an edited user array element', () => {
            assert.deepEqual(
                users({
                    list: [
                        {
                            id: 1,
                            username: 'Some name',
                            job: 'Some job',
                        }, {
                            id: 2,
                            username: 'Other name',
                            job: 'Other job',
                        }
                    ]
                }, {
                    type: 'USERS_EDIT',
                    id: 2,
                    username: 'Changed name',
                    job: 'Changed job',
                }), {
                    list: [
                        {
                            id: 1,
                            username: 'Some name',
                            job: 'Some job',
                        }, {
                            id: 2,
                            username: 'Changed name',
                            job: 'Changed job',
                        }
                    ]
                }
            );
        });
    });

    describe('USERS_DELETE', () => {
        it('should return the user array without the deleted element', () => {
            assert.deepEqual(
                users({
                    list: [
                        {
                            id: 1,
                            username: 'Some name',
                            job: 'Some job',
                        }, {
                            id: 2,
                            username: 'Other name',
                            job: 'Other job',
                        }
                    ]
                }, {
                    type: 'USERS_DELETE',
                    id: 2,
                }), {
                    list: [
                        {
                            id: 1,
                            username: 'Some name',
                            job: 'Some job',
                        }
                    ]
                }
            );
        });
    });

    describe('USERS_MODAL_DELETE_SHOW', () => {
        it('should set the list_delete data when its undefined', () => {
            assert.deepEqual(
                users({}, {
                    type: 'USERS_MODAL_DELETE_SHOW',
                    id: 2,
                    username: 'John',
                }), {
                    modal: {
                        list_delete: {
                            show: true,
                            id: 2,
                            username: 'John',
                        }
                    }
                }
            );
        });
        it('should set the list_delete data when it exists', () => {
            assert.deepEqual(
                users({
                    modal: {
                        list_delete: {
                            show: false,
                            id: 0,
                            username: '',
                        }
                    }
                }, {
                    type: 'USERS_MODAL_DELETE_SHOW',
                    id: 2,
                    username: 'John',
                }), {
                    modal: {
                        list_delete: {
                            show: true,
                            id: 2,
                            username: 'John',
                        }
                    }
                }
            );
        });
    });

    describe('USERS_MODAL_DELETE_HIDE', () => {
        it('should set the list_delete data', () => {
            assert.deepEqual(
                users({
                    modal: {
                        list_delete: {
                            show: true,
                            id: 2,
                            username: 'John',
                        }
                    }
                }, {
                    type: 'USERS_MODAL_DELETE_HIDE',
                }), {
                    modal: {
                        list_delete: {
                            show: false,
                            id: 0,
                            username: '',
                        }
                    }
                }
            );
        });
    });

    describe('USERS_FETCH_LIST_SUCCESS', () => {
        it('should return a list of users', () => {
            assert.deepEqual(
                users({}, {
                    type: 'USERS_FETCH_LIST_SUCCESS',
                    users: [{
                        id: 1,
                        username: 'Some name',
                        job: 'Some job',
                    }],
                }), {
                    list: [{
                        id: 1,
                        username: 'Some name',
                        job: 'Some job',
                    }],
                }
            );
        });
    });
});