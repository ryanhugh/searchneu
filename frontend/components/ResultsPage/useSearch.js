/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */
import { useReducer, useEffect } from 'react';
import macros from '../macros';

const searchReducer = (state, action) => {
  switch (action.type) {
    case 'NEW_SEARCH':
      return {
        ...state,
        results: [],
        isLoadingNew: true,
        isLoadingMore: false,
      };
    case 'LOAD_MORE':
      return {
        ...state,
        isLoadingNew: false,
        isLoadingMore: true,
      };
    case 'SEARCH_SUCCESS':
      return {
        ...state,
        results: action.payload,
        isLoadingNew: false,
        isLoadingMore: false,
        page: 1,
      };
    case 'LOAD_MORE_SUCCESS':
      // Only accept if currently loading more.
      // Prevents race condition where a new search is executed mid-loadMore, and old loadMore results come in.
      if (state.isLoadingMore) {
        return {
          ...state,
          results: action.payload,
          isLoadingNew: false,
          isLoadingMore: false,
          page: state.page + 1,
        };
      }
      return state;
    default:
      throw new Error();
  }
};

/**
 * @param {func} doSearch async (page: number) => results[]. Needs to be memoized.
 * @returns {results: results[], isLoading: boolean, loadMore}
 *  results is a list of results
 *  ready represents whether the results are ready to be displayed
 *  loadMore is a function that triggers loading the next page when invoked
 */
export default function useSearch(doSearch) {
  const [state, dispatch] = useReducer(
    searchReducer,
    {
      results: [], isLoadingNew: true, isLoadingMore: false, page: 0,
    },
  );
  const {
    results, isLoadingNew, isLoadingMore, page,
  } = state;

  useEffect(() => {
    let ignore = false;
    const searchWrap = async () => {
      dispatch({ type: 'NEW_SEARCH' });
      const data = await doSearch(0);
      // Ignore will be true if out of order because useEffect is cleaned up before executing the next effect
      if (ignore) {
        macros.log('Did not come back in order, discarding');
      } else {
        dispatch({ type: 'SEARCH_SUCCESS', payload: data });
      }
    };
    searchWrap();
    return () => { ignore = true; };
  }, [doSearch]);

  async function loadMore() {
    // Don't load more if we're already loading something else
    if (isLoadingNew || isLoadingMore) {
      return;
    }
    dispatch({ type:'LOAD_MORE' });
    const data = await doSearch(page);
    dispatch({ type: 'LOAD_MORE_SUCCESS', payload: data });
  }

  return {
    results: results,
    ready: !isLoadingNew,
    loadMore: loadMore,
  };
}
