/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */
import React, { useCallback } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Dropdown } from 'semantic-ui-react';
import logo from '../images/logo.svg';
import search from '../search';
import macros from '../macros';
import ResultsLoader from '../ResultsLoader';
import SearchBar from '../ResultsPage/SearchBar';
import Footer from '../Footer';
import useSearch from '../ResultsPage/useSearch';


const termDropDownOptions = [
  {
    text: 'Summer I 2020',
    value: '202040',
  },
  {
    text: 'Summer II 2020',
    value: '202060',
  },
  {
    text: 'Summer Full 2020',
    value: '202050',
  },
  {
    text: 'Spring 2020',
    value: '202030',
  },
  {
    text: 'Fall 2019',
    value: '202010',
  },
];

let count = 0;
function logSearch(searchQuery) {
  searchQuery = searchQuery.trim();

  if (searchQuery) {
    count++;
    macros.logAmplitudeEvent('Search', { query: searchQuery.toLowerCase(), sessionCount: count });
  }
}

export default function Results() {
  const { termId, query } = useParams();
  const history = useHistory();

  const doSearch = useCallback(async (page) => {
    const obj = await search.search(query, termId, 5 + page * 10);
    const results = obj.results;
    if (page === 0) {
      logSearch(query);
    }
    return results;
  }, [termId, query]);

  const { results, ready, loadMore } = useSearch(doSearch);

  const resultsElement = () => {
    if (!ready) {
      return <div className='Results_Loading' />;
    }
    if (results.length) {
      return (
        <div>
          <div className='subjectContaineRowContainer'>
            {/* {subjectInfoRow} */}
          </div>
          <ResultsLoader
            results={ results }
            loadMore={ loadMore }
          />
        </div>
      );
    }
    return (
      <div className='Results_EmptyContainer'>
        <h3>
            No Results
        </h3>
        <div className='Results_EmptyBottomLine'>
            Want to&nbsp;
          <a target='_blank' rel='noopener noreferrer' href={ `https://google.com/search?q=${macros.collegeName} ${query}` }>
              search for&nbsp;
            <div className='ui compact segment Results_EmptyText'>
              <p>
                {query}
              </p>
            </div>
                &nbsp;on Google
          </a>
            ?
        </div>
      </div>
    );
  };

  return (
    <>
      <div className='Results_Header'>
        <img src={ logo } className='Results__Logo' alt='logo' onClick={ () => { history.push('/'); } } />
        <div className='Results__spacer' />
        <div className='Results__searchwrapper'>
          <SearchBar
            onSearch={ (val) => {
              history.push(`/${termId}/${val}`);
            } }
            query={ query }
          />
        </div>
        <Dropdown
          selection
          compact
          defaultValue={ termId }
          placeholder='Spring 2020'
          className='termdropdown termdropdown--compact'
          options={ termDropDownOptions }
          onChange={ (e, data) => { history.push(`/${data.value}/${query}`); } }
        />
      </div>
      <div className='Results_Container'>
        <div>
          {resultsElement()}
        </div>

        <div className='botttomPadding' />

        <Footer />
      </div>
    </>

  );
}
