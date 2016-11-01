// users reducer
export default function suggest(state = {}, action) {
    let new_state = JSON.parse(JSON.stringify(state));
    switch (action.type) {

        // add a user
        case 'USERS_ADD':
            const id = action.id ? action.id : Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
            // https://github.com/reactjs/redux/blob/master/examples/todomvc/src/reducers/todos.js
            /*return [
                ...state.list,
                {
                    id: id,
                    username: action.username,
                    job: action.job,
                }
            ];*/
            new_state.list.push({
                id: id,
                username: action.username,
                job: action.job,
            });
            break;

        // edit a user
        case 'USERS_EDIT':
            for (const user of new_state.list) {
                if (user.id === action.id) {
                    Object.assign(user, {
                        username: action.username,
                        job: action.job,
                    });
                    break;
                }
            }
            break;

        // delete a user
        case 'USERS_DELETE':
            for (const index in new_state.list) {
                if (new_state.list[index].id === action.id) {
                    new_state.list.splice(index, 1);   // delete new_state.list[index] leaves a hole in the array
                    break;
                }
            }
            break;

        // show the delete confirmation for the user
        case 'USERS_MODAL_DELETE_SHOW':
            new_state.modal = new_state.modal ? new_state.modal : {};
            new_state.modal.list_delete = {
                show: true,
                id: action.id,
                username: action.username,
            }
            break;

        // hide the delete confirmation for the user
        case 'USERS_MODAL_DELETE_HIDE':
            new_state.modal.list_delete = {
                show: false,
                id: 0,
                username: '',
            }
            break;

        // the users list saga fetching was a success
        case 'USERS_FETCH_LIST_SUCCESS':
            new_state.list = action.users;
            break;

        // initial
        default:
            return state;
    }
    return new_state;
}