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
  const [params, setParams] = useState(initialParams);
  const [page, setPage] = useState(0);
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState(Status.FETCHING_NEW);

  useEffect(() => {
    let ignore = false;
    const searchWrap = async () => {
      const data = await fetchResults(params, page);
      // Ignore will be true if out of order because useEffect is cleaned up before executing the next effect
      if (ignore) {
        macros.log('Did not come back in order, discarding');
      } else {
        setResults(data);
        setStatus(Status.SUCCESS);
      }
    };
    searchWrap();
    return () => { ignore = true; };
  }, [params, page, fetchResults]);

  function loadMore() {
    // Only load more if nothing else is mid-flight
    if (status === Status.SUCCESS) {
      setStatus(Status.FETCHING_MORE);
      setPage(page + 1);
    }
  }

  const doSearch = useCallback((p) => {
    setStatus(Status.FETCHING_NEW);
    setPage(0);
    setParams(p);
  }, []);

  return {
    results: results,
    isReady: status !== Status.FETCHING_NEW,
    loadMore: loadMore,
    doSearch: doSearch,
  };
}
