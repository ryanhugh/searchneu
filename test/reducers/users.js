import assert from 'assert';

import users from '../../src_users/reducers/users';

// unit tests for the users reducers
// mocha - http://mochajs.org/#getting-started
// assert - https://nodejs.org/api/assert.html#assert_assert_deepequal_actual_expected_message
describe('Users reducer', () => {
    describe('add()', () => {
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
                    type: 'users.add',
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

    describe('edit()', () => {
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
                    type: 'users.edit',
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

    describe('delete()', () => {
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
                    type: 'users.delete',
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

    describe('modalDeleteShow()', () => {
        it('should set the list_delete data when its undefined', () => {
            assert.deepEqual(
                users({}, {
                    type: 'users.modalDeleteShow',
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
                    type: 'users.modalDeleteShow',
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

    describe('modalDeleteHide()', () => {
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
                    type: 'users.modalDeleteHide',
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

    describe('fetchListSuccess()', () => {
        it('should return a list of users', () => {
            assert.deepEqual(
                users({}, {
                    type: 'users.fetchListSuccess',
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
