import { call, put } from "redux-saga/effects";
import assert from "assert";
import { usersFetchList, usersAddEdit, usersDelete } from "../../src_users/sagas/users";
import ApiUsers from "../../src_users/api/users";

// unit tests for the users saga
describe('Users saga', () => {
  describe('usersFetchList()', () => {
    const generator = usersFetchList();

    it('should return the ApiUsers.getList call', () => {
      assert.deepEqual(generator.next().value, call(ApiUsers.getList));
    });

    it('should return the USERS_LIST_SAVE action', () => {
      assert.deepEqual(generator.next().value, put({type: 'USERS_LIST_SAVE', users: undefined}));
    });

    it('should be finished', () => {
      assert.equal(generator.next().done, true);
    });
  });

  describe('usersAddEdit() - add', () => {
    const action = {
      user: {},
      callbackSuccess: () => {},
    };
    const generator = usersAddEdit(action);

    it('should return the ApiUsers.addEdit call', () => {
      assert.deepEqual(generator.next().value, call(ApiUsers.addEdit));
    });

    it('should return the USERS_ADD_SAVE action', () => {
      assert.deepEqual(generator.next().value, put({
        type: 'USERS_ADD_SAVE',
        user: action.user,
      }));
    });

    it('should be finished', () => {
      assert.equal(generator.next().done, true);
    });
  });

  describe('usersAddEdit() - edit', () => {
    const action = {
      user: {id: 1},
      callbackSuccess: () => {},
    };
    const generator = usersAddEdit(action);

    it('should return the ApiUsers.addEdit call', () => {
      assert.deepEqual(generator.next().value, call(ApiUsers.addEdit));
    });

    it('should return the USERS_EDIT_SAVE action', () => {
      assert.deepEqual(generator.next().value, put({
        type: 'USERS_EDIT_SAVE',
        user: action.user,
      }));
    });

    it('should be finished', () => {
      assert.equal(generator.next().done, true);
    });
  });

  describe('usersDelete()', () => {
    const action = {
      user_id: 1,
    };
    const generator = usersDelete(action);

    it('should return the ApiUsers.delete call', () => {
      assert.deepEqual(generator.next().value, call(ApiUsers.delete));
    });

    it('should return the USERS_DELETE_SAVE action', () => {
      assert.deepEqual(generator.next().value, put({
        type: 'USERS_DELETE_SAVE',
        user_id: action.user_id,
      }));
    });

    it('should be finished', () => {
      assert.equal(generator.next().done, true);
    });
  });
});
