import { call, put } from 'redux-saga/effects';
import assert from 'assert';

import { usersFetchList, usersAdd, usersEdit, usersDelete }  from '../../src_users/sagas/users';
import ApiUsers from '../../src_users/api/users';

// unit tests for the users saga
describe('Users saga', () => {
    describe('usersFetchList()', () => {
        const generator = usersFetchList();
        it('should return the ApiUsers.getList call', () => {
            assert.deepEqual(generator.next().value, call(ApiUsers.getList));
        });
        it('should return the users.fetchListSuccess action', () => {
            assert.deepEqual(generator.next().value, put({type: 'users.fetchListSuccess', users: undefined,}));
        });
        it('should be finished', () => {
            assert.equal(generator.next().done, true);
        });
    });

    describe('usersAdd()', () => {
        const generator = usersAdd();
        // nothing to test
    });

    describe('usersEdit()', () => {
        const generator = usersEdit();
        // nothing to test
    });

    describe('usersDelete()', () => {
        const generator = usersDelete();
        // nothing to test
    });
});
