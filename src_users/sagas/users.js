import {call, put} from "redux-saga/effects";
import ApiUsers from "../api/users";

// fetch the user's list
export function* usersFetchList(action) {
    // call the api to get the users list
    const users = yield call(ApiUsers.getList);

    // dispatch the success action with the users attached
    yield put({
        type: 'USERS_FETCH_LIST_SUCCESS',
        users: users,
    });
}

// add a user
export function* usersAddSave(action) {
    yield call(ApiUsers.add, action);
}

// edit a user
export function* usersEditSave(action) {
    yield call(ApiUsers.edit, action);
}

// delete a user
export function* usersDeleteSave(action) {
    yield call(ApiUsers.delete, action);
}