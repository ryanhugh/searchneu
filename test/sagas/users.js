import {call, put} from "redux-saga/effects";
import assert from "assert";
import {usersFetchList, usersAddSave, usersEditSave, usersDeleteSave} from "../../src_users/sagas/users";
import ApiUsers from "../../src_users/api/users";

// unit tests for the users saga
describe('Users saga', () => {
    describe('usersFetchList()', () => {
        const generator = usersFetchList();
        it('should return the ApiUsers.getList call', () => {
            assert.deepEqual(generator.next().value, call(ApiUsers.getList));
        });
        it('should return the USERS_FETCH_LIST_SUCCESS action', () => {
            assert.deepEqual(generator.next().value, put({type: 'USERS_FETCH_LIST_SUCCESS', users: undefined,}));
        });
        it('should be finished', () => {
            assert.equal(generator.next().done, true);
        });
    });

    describe('usersAddSave()', () => {
        const generator = usersAddSave();
        // nothing to test
    });

    describe('usersEditSave()', () => {
        const generator = usersEditSave();
        // nothing to test
    });

    describe('usersDeleteSave()', () => {
        const generator = usersDeleteSave();
        // nothing to test
    });
});