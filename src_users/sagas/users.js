import { call, put } from 'redux-saga/effects';

import ApiUsers from '../api/users';

/**
 * Fetch the user's list
 *
 * @param action
 */
export function* usersFetchList(action) {
    // call the api to get the users list
    const users = yield call(ApiUsers.getList);

    // dispatch the success action with the users attached
    yield put({
        type: 'users.fetchListSuccess',
        users: users,
    });
}

/**
 * Add a user
 *
 * @param action
 */
export function* usersAdd(action) {
    yield call(ApiUsers.add, action);
}

/**
 * Edit a user
 *
 * @param action
 */
export function* usersEdit(action) {
    yield call(ApiUsers.edit, action);
}

/**
 * Delete a user
 *
 * @param action
 */
export function* usersDelete(action) {
    yield call(ApiUsers.delete, action);
}
