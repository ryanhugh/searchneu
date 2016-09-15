import assert from 'assert';

import users from '../../src/reducers/users';

// unit tests for the users reducers
// mocha - http://mochajs.org/#getting-started
// assert - https://nodejs.org/api/assert.html
describe('Users reducer', () => {
    describe('add()', () => {
        it('should return a new user array element', () => {
            const state = {list: [{
                id: 1,
                username: 'some name',
                job: 'some job',
            }]};
            const action = {
                type: 'users.add',
                username: 'other name',
                job: 'other job,'
            };
            const new_state = users(state, action);
            assert.equal(state.list.length, 1);
            assert.equal(state.list[0].username, 'some name');
            assert.equal(new_state.list.length, 2);
            assert.equal(new_state.list[0].username, 'some name');
            assert.equal(new_state.list[1].username, 'other name');
        });
    });

    describe('edit()', () => {
        it('should return an edited user array element', () => {
            const state = {list: [{
                id: 1,
                username: 'some name',
                job: 'some job',
            }, {
                id: 2,
                username: 'other name',
                job: 'other job',
            }]};
            const action = {
                type: 'users.edit',
                id: 2,
                username: 'changed name',
                job: 'changed job,'
            };
            const new_state = users(state, action);
            assert.equal(state.list.length, 2);
            assert.equal(state.list[0].username, 'some name');
            assert.equal(state.list[1].username, 'other name');
            assert.equal(new_state.list.length, 2);
            assert.equal(new_state.list[0].username, 'some name');
            assert.equal(new_state.list[1].username, 'changed name');
        });
    });

    describe('delete()', () => {
        it('should return the user array without the deleted element', () => {
            const state = {list: [{
                id: 1,
                username: 'some name',
                job: 'some job',
            }, {
                id: 2,
                username: 'other name',
                job: 'other job',
            }]};
            const action = {
                type: 'users.delete',
                id: 2,
            };
            const new_state = users(state, action);
            assert.equal(state.list.length, 2);
            assert.equal(state.list[0].username, 'some name');
            assert.equal(state.list[1].username, 'other name');
            assert.equal(new_state.list.length, 1);
            assert.equal(new_state.list[0].username, 'some name');
        });
    });

    describe('modalDeleteShow()', () => {
        it('should set the list_delete data when its undefined', () => {
            const state = {};
            const action = {
                type: 'users.modalDeleteShow',
                id: 2,
                username: 'John',
            };
            const new_state = users(state, action);
            assert.equal(new_state.modal.list_delete.show, true);
            assert.equal(new_state.modal.list_delete.id, 2);
            assert.equal(new_state.modal.list_delete.username, 'John');
        });
        it('should set the list_delete data when it exists', () => {
            const state = {
                modal: {
                    list_delete: {
                        show: false,
                        id: 0,
                        username: '',
                    }
                }
            };
            const action = {
                type: 'users.modalDeleteShow',
                id: 2,
                username: 'John',
            };
            const new_state = users(state, action);
            assert.equal(state.modal.list_delete.show, false);
            assert.equal(state.modal.list_delete.id, 0);
            assert.equal(state.modal.list_delete.username, '');
            assert.equal(new_state.modal.list_delete.show, true);
            assert.equal(new_state.modal.list_delete.id, 2);
            assert.equal(new_state.modal.list_delete.username, 'John');
        });
    });

    describe('modalDeleteHide()', () => {
        it('should set the list_delete data', () => {
            const state = {
                modal: {
                    list_delete: {
                        show: true,
                        id: 2,
                        username: 'John',
                    }
                }
            };
            const action = {
                type: 'users.modalDeleteHide',
            };
            const new_state = users(state, action);
            assert.equal(state.modal.list_delete.show, true);
            assert.equal(state.modal.list_delete.id, 2);
            assert.equal(state.modal.list_delete.username, 'John');
            assert.equal(new_state.modal.list_delete.show, false);
            assert.equal(new_state.modal.list_delete.id, 0);
            assert.equal(new_state.modal.list_delete.username, '');
        });
    });

    describe('fetchListSuccess()', () => {
        it('should return a list of users', () => {
            const state = {list: []};
            const action = {
                type: 'users.fetchListSuccess',
                users: [{
                    id: 1,
                    username: 'some name',
                    job: 'some job',
                }],
            };
            const new_state = users(state, action);
            assert.equal(state.list.length, 0);
            assert.equal(new_state.list.length, 1);
            assert.equal(new_state.list[0].username, 'some name');
        });
    });
});
