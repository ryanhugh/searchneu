/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */
import React, { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Dropdown } from 'semantic-ui-react';
import logo from '../images/logo.svg';
import logoSmall from '../images/logo_small.svg';
import search from '../search';
import macros from '../macros';
import ResultsLoader from '../ResultsLoader';
import SearchBar from '../ResultsPage/SearchBar';
import Footer from '../Footer';


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

const mobileTermDropDownOptions = [
  {
    text: 'S1 20',
    value: '202040',
  },
  {
    text: 'S2 20',
    value: '202060',
  },
  {
    text: 'SF 20',
    value: '202050',
  },
  {
    text: 'SP 20',
    value: '202030',
  },
  {
    text: 'F 19',
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
  const [searchStatus, setSearchStatus] = useState({ searchResults: [], isLoading: true });
  const { searchResults, isLoading } = searchStatus;
  const [resultCursor, setResultCursor] = useState(5);
  const history = useHistory();


  useEffect(() => {
    let ignore = false;
    const doSearch = async () => {
      setSearchStatus({ searchResults: searchResults });
      const obj = await search.search(query, termId, resultCursor);
      const results = obj.results;

      // Ignore will be true if out of order because useEffect is cleaned up before executing the next effect
      if (ignore) {
        macros.log('Did not come back in order, discarding');
      } else {
        setSearchStatus({ searchResults: results, isLoading: false });
      }
    };
    doSearch();
    logSearch(query);
    return () => { ignore = true; };
  }, [query, termId, resultCursor]);

  const resultsElement = () => {
    if (isLoading || searchResults.length) {
      return (
        <div style={{ display: isLoading ? 'none' : 'block' }}>
          <div className='subjectContaineRowContainer'>
            {/* {subjectInfoRow} */}
          </div>
          <ResultsLoader
            results={ searchResults }
            loadMore={ () => { setResultCursor(searchResults.length + 10); } }
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
        <img src={ logoSmall } className='Results__Logo Results__Logo--sm' alt='logo' onClick={ () => { history.push('/'); } } />
        <div className='Results__spacer' />
        <div className='Results__searchwrapper'>
          <SearchBar
            onSearch={ (val) => {
              setResultCursor(5);
              setSearchStatus({ ...searchStatus, isLoading: true });
              history.push(`/${termId}/${val}`);
            } }
            query={ query }
          />
        </div>
        <Dropdown
          selection
          compact
          defaultValue={ termId }
          placeholder='Spring 2018'
          className='Results_TermDropDown'
          options={ macros.isMobile ? mobileTermDropDownOptions : termDropDownOptions }
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
