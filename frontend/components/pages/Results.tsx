/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */
import React, { useCallback } from 'react';
import _ from 'lodash';
import { useHistory, useParams } from 'react-router-dom';
import {
  useQueryParams, BooleanParam, useQueryParam,
} from 'use-query-params';
import useDeepCompareEffect from 'use-deep-compare-effect';
import logo from '../images/logo.svg';
import search from '../search';
import macros from '../macros';
import SearchBar from '../ResultsPage/SearchBar';
import TermDropdown from '../ResultsPage/TermDropdown';
import Footer from '../Footer';
import useSearch from '../ResultsPage/useSearch';
import FilterPanel from '../ResultsPage/FilterPanel';
import FilterPills from '../ResultsPage/FilterPills';
import EmptyResultsContainer from '../ResultsPage/EmptyResultsContainer';
import MobileSearchOverlay from '../ResultsPage/MobileSearchOverlay';
import useAtTop from '../ResultsPage/useAtTop';
import {
  FilterSelection, QUERY_PARAM_ENCODERS, DEFAULT_FILTER_SELECTION, areFiltersSet,
} from '../ResultsPage/filters';
import ResultsLoader from '../ResultsPage/ResultsLoader';
import { BLANK_SEARCH_RESULT, SearchResult } from '../types';


interface SearchParams {
  termId: string,
  query: string,
  filters: FilterSelection
}

let count = 0;
// Log search queries to amplitude on enter.
function logSearch(searchQuery: string) {
  searchQuery = searchQuery.trim();

  if (searchQuery) {
    count++;
    macros.logAmplitudeEvent('Search', { query: searchQuery.toLowerCase(), sessionCount: count });
  }
}

// Retreive result data from backend.
const fetchResults = async ({ query, termId, filters }: SearchParams, page: number): Promise<SearchResult> => {
  const response: SearchResult = await search.search(query, termId, filters, (1 + page) * 10);
  if (page === 0) {
    logSearch(query);
  }
  return response;
};

export default function Results() {
  const atTop = useAtTop();
  const [showOverlay, setShowOverlay] = useQueryParam('overlay', BooleanParam);
  const { termId, query = '' } = useParams();
  const [qParams, setQParams] = useQueryParams(QUERY_PARAM_ENCODERS);
  const history = useHistory();
  const setSearchQuery = (q: string) => { history.push(`/${termId}/${q}${history.location.search}`); }
  const setTerm = useCallback((t: string) => { history.push(`/${t}/${query}${history.location.search}`); }, [history, query])

  const filters: FilterSelection = _.merge({}, DEFAULT_FILTER_SELECTION, qParams);

  const searchParams: SearchParams = { termId, query, filters };

  const us = useSearch(searchParams, BLANK_SEARCH_RESULT(), fetchResults);
  const {
    isReady, loadMore, doSearch,
  } = us;
  const { results, filterOptions } = us.results;

  useDeepCompareEffect(() => {
    doSearch(searchParams);
  }, [searchParams, doSearch]);

  if (showOverlay && macros.isMobile) {
    return (
      <MobileSearchOverlay
        query={ query }
        filterSelection={ filters }
        filterOptions={ filterOptions }
        setFilterPills={ setQParams }
        setQuery={ (q: string) => setSearchQuery(q) }
        onExecute={ () => setShowOverlay(false) }
      />
    )
  }

  return (
    <div>
      <div className={ `Results_Header ${atTop ? 'Results_Header-top' : ''}` }>
        <img src={ logo } className='Results__Logo' alt='logo' onClick={ () => { history.push('/'); } } />
        <div className='Results__spacer' />
        <div className='Results__searchwrapper'>
          <SearchBar
            onSearch={ setSearchQuery }
            query={ query }
            onClick={ () => {
              if (macros.isMobile) {
                setShowOverlay(true);
              }
            } }
          />
        </div>
        <TermDropdown
          compact
          termId={ termId }
          onChange={ setTerm }
        />
      </div>
      <div className='Results_Container'>
        {!macros.isMobile && (
          <>
            <div className='Results_SidebarWrapper'>
              <FilterPanel
                options={ filterOptions }
                selected={ filters }
                setActive={ setQParams }
              />
            </div>
            <div className='Results_SidebarSpacer' />
          </>
        )}
        <div className='Results_Main'>
          { areFiltersSet(filters)
          && <FilterPills filters={ filters } setFilters={ setQParams } />}
          {!isReady && <div style={{ visibility: 'hidden' }} />}
          {isReady && results.length === 0 && <EmptyResultsContainer query={ query } />}
          {isReady && results.length > 0
            && (
              <ResultsLoader
                results={ results }
                loadMore={ loadMore }
              />
            )}
          <Footer />
        </div>
      </div>
      <div className='botttomPadding' />
    </div>

  );
}
