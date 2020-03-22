/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */
import React, {
  useEffect, useState, useCallback, useRef,
} from 'react';
import _ from 'lodash';
import { useHistory, useParams } from 'react-router-dom';
import { Location } from 'history';
import { useQueryParams, BooleanParam, ArrayParam, useQueryParam } from 'use-query-params';
import useDeepCompareEffect from 'use-deep-compare-effect';
import logo from '../images/logo.svg';
import search from '../search';
import macros from '../macros';
import ResultsLoader from '../ResultsLoader';
import SearchBar from '../ResultsPage/SearchBar';
import TermDropdown from '../ResultsPage/TermDropdown';
import Footer from '../Footer';
import useSearch from '../ResultsPage/useSearch';
import FilterPanel from '../ResultsPage/FilterPanel';
import ActiveFilters from '../ResultsPage/ActiveFilters';
import { FilterSelection, SearchItem } from '../types';
import EmptyResultsContainer from './EmptyResultsContainer';
import MobileSearchOverlay from '../ResultsPage/MobileSearchOverlay';

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
const fetchResults = async ({ query, termId, filters }: SearchParams, page: number): Promise<SearchItem[]> => {
  const results: SearchItem[] = await search.search(query, termId, filters, (1 + page) * 10);
  if (page === 0) {
    logSearch(query);
  }
  return results;
};

const BS_FILTER_OPTIONS = {
  NUpath: [
    {
      key: 'DD', value: 'DD', text: 'diff div', count: 1,
    },
    {
      key: 'IC', value: 'IC', text: 'interp cultures', count: 1,
    },
  ],
  subject: [],
  classType: [],
}

const QUERY_PARAM_ENCODERS = {
  online: BooleanParam,
  NUpath: ArrayParam,
  subject: ArrayParam,
  classType: ArrayParam,
};

const DEFAULT_PARAMS = {
  online: false,
  NUpath: [],
  subject: [],
  classType: [],
}

export default function Results() {
  const [atTop, setAtTop] = useState(true);
  const [showOverlay, setShowOverlay] = useQueryParam('overlay', BooleanParam);
  const oldLoc = useRef<Location>(); // Url before going to the overlay
  const { termId, query = '' } = useParams();
  const [qParams, setQParams] = useQueryParams(QUERY_PARAM_ENCODERS);
  const history = useHistory();
  const setSearchQuery = (q: string) => { history.push(`/${termId}/${q}${history.location.search}`); }
  const setTerm = useCallback((t: string) => { history.push(`/${t}/${query}${history.location.search}`); }, [history, query])

  const filters: FilterSelection = _.merge({}, DEFAULT_PARAMS, qParams);

  const searchParams: SearchParams = { termId, query, filters };

  useEffect(() => {
    const handleScroll = () => {
      const pageY = document.body.scrollTop || document.documentElement.scrollTop;
      setAtTop(pageY === 0);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [setAtTop]);

  const {
    results, isReady, loadMore, doSearch,
  } = useSearch(searchParams, fetchResults);

  useDeepCompareEffect(() => {
    doSearch(searchParams);
  }, [searchParams, doSearch]);

  if (showOverlay && macros.isMobile) {
    return (
      <MobileSearchOverlay
        query={ query }
        activeFilters={ filters }
        filterOptions={ BS_FILTER_OPTIONS }
        setActiveFilters={ setQParams }
        setQuery={ (q: string) => setSearchQuery(q) }
        onExecute={ () => setShowOverlay(false) }
        onClose={ () => history.push(oldLoc.current) }
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
                oldLoc.current = history.location;
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
                options={ BS_FILTER_OPTIONS }
                active={ filters }
                setActive={ setQParams }
              />
            </div>
            <div className='Results_SidebarSpacer' />
          </>
        )}
        <div className='Results_Main'>
          <ActiveFilters filters={ filters } setFilters={ setQParams } />
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
