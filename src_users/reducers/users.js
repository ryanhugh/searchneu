import { reducerCall } from './index';

/**
 * Users reducer
 *
 * @param state
 * @param action
 * @returns {*}
 */
export default function users(state = {}, action) {
    return reducerCall(state, action, reducerClass);
}

/**
 * Users reducer static class
 */
class reducerClass
{
    /**
     * Add a user
     *
     * @param new_state
     * @param action
     * @returns {*}
     */
    static add(new_state, action)
    {
        // set the user id
        const id = action.id ? action.id : Number((Math.random() * 1000000).toPrecision(6));

        // add the user
        new_state.list.push({
            id: id,
            username: action.username,
            job: action.job,
        });
        return new_state;
    }

    /**
     * Edit a user
     *
     * @param new_state
     * @param action
     * @returns {*}
     */
    static edit(new_state, action)
    {
        for (const user of new_state.list) {
            if (user.id === action.id) {
                Object.assign(user, {
                    username: action.username,
                    job: action.job,
                });
                break;
            }
        }
        return new_state;
    }

    /**
     * Delete a user
     *
     * @param new_state
     * @param action
     * @returns {*}
     */
    static delete(new_state, action)
    {
        for (const index in new_state.list) {
            if (new_state.list[index].id === action.id) {
                new_state.list.splice(index, 1);   // delete new_state.list[index] leaves a hole in the array
                break;
            }
        }
        return new_state;
    }

    /**
     * Show the delete confirmation for the user
     *
     * @param new_state
     * @param action
     * @returns {*}
     */
    static modalDeleteShow(new_state, action)
    {
        new_state.modal = new_state.modal ? new_state.modal : {};
        new_state.modal.list_delete = {
            show: true,
            id: action.id,
            username: action.username,
        }
        return new_state;
    }

    /**
     * Hide the delete confirmation for the user
     *
     * @param new_state
     * @param action
     * @returns {*}
     */
    static modalDeleteHide(new_state, action)
    {
        new_state.modal.list_delete = {
            show: false,
            id: 0,
            username: '',
        }
        return new_state;
    }

    /**
     * The users list saga fetching was a success
     *
     * @param new_state
     * @param action
     * @returns {*}
     */
    static fetchListSuccess(new_state, action)
    {
        new_state.list = action.users;
        return new_state;
    }
}
