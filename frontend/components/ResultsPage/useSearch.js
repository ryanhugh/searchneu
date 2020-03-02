/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */
import {
  useEffect, useState, useCallback,
} from 'react';
import macros from '../macros';

const Status = {
  FETCHING_NEW: 1,
  FETCHING_MORE: 2,
  SUCCESS: 3,
};

/**
 * @param {object} initialParams initial params to give fetchresults
 * @param {func} fetchResults async (params, page: number) => results[].
 * @returns {results: results[], isReady: boolean, loadMore}
 *  results is a list of results
 *  isReady represents whether the results are ready to be displayed
 *  loadMore is a function that triggers loading the next page when invoked
 *  doSearch triggers search execution. Expects a object containing search params
 */
export default function useSearch(initialParams, fetchResults) {
  // Batch all into one state to avoid multiple rerender
  const [state, setState] = useState({
    params: initialParams, page: 0, results: [], status: Status.FETCHING_NEW,
  });
  // Equivalent of setState in class components.
  function updateState(changes) {
    setState((prev) => ({ ...prev, ...changes }));
  }
  const {
    params, page, results, status,
  } = state;

  useEffect(() => {
    let ignore = false;
    const searchWrap = async () => {
      const data = await fetchResults(params, page);
      // Ignore will be true if out of order because useEffect is cleaned up before executing the next effect
      if (ignore) {
        macros.log('Did not come back in order, discarding');
      } else {
        updateState({ results: data, status: Status.SUCCESS });
      }
    };
    searchWrap();
    return () => { ignore = true; };
  }, [params, page, fetchResults]);

  const loadMore = useCallback(() => {
    // Only load more if nothing else is mid-flight
    setState((prev) => {
      if (prev.status === Status.SUCCESS) {
        return { ...prev, status: Status.FETCHING_MORE, page: prev.page + 1 };
      }
      return prev;
    });
  }, []);

  const doSearch = useCallback((p) => {
    updateState({
      params: p, page: 0, status: Status.FETCHING_NEW,
    });
  }, []);

  return {
    results: results,
    isReady: status !== Status.FETCHING_NEW,
    loadMore: loadMore,
    doSearch: doSearch,
  };
}
