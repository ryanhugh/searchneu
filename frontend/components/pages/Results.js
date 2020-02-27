import React, { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Dropdown } from 'semantic-ui-react';
import logo from '../images/logo.svg';
import logoSmall from '../images/logo_small.svg';
import logoInput from '../images/logo_input.svg';
import search from '../search';
import macros from '../macros';
import ResultsLoader from '../ResultsLoader';
import SearchBar from '../ResultsPage/SearchBar';
import ResultsFooter from '../ResultsPage/ResultsFooter';


const termDropDownOptions = [
  {
    text: 'Spring 2020',
    value: '202030',
  },
  {
    text: 'Fall 2019',
    value: '202010',
  },
  {
    text: 'Summer I 2019',
    value: '201940',
  },
  {
    text: 'Summer II 2019',
    value: '201960',
  },
  {
    text: 'Summer Full 2019',
    value: '201950',
  },
  {
    text: 'Spring 2019',
    value: '201930',
  },
];

const mobileTermDropDownOptions = [
  {
    text: 'SP 20',
    value: '202030',
  },
  {
    text: 'F 19',
    value: '202010',
  },
  {
    text: 'S1 19',
    value: '201940',
  },
  {
    text: 'S2 19',
    value: '201960',
  },
  {
    text: 'SF 19',
    value: '201950',
  },
  {
    text: 'SP 19',
    value: '201930',
  },
];


export default function Results() {
  const { termId, query } = useParams();
  const [searchResults, setSearchResults] = useState([]);
  const [resultCursor, setResultCursor] = useState(5);
  const history = useHistory();


  useEffect(() => {
    let ignore = false;
    const doSearch = async () => {
      const obj = await search.search(query, termId, resultCursor);
      const results = obj.results;

      // Ignore will be true if out of order because useEffect is cleaned up before executing the next effect
      if (ignore) {
        macros.log('Did not come back in order, discarding');
      } else {
        setSearchResults(results);
      }
    };
    doSearch();
    return () => { ignore = true; };
  }, [query, termId, resultCursor]);

  const resultsElement = () => {
    return searchResults.length ? (
      <div>
        <div className='subjectContaineRowContainer'>
          {/* {subjectInfoRow} */}
        </div>
        <ResultsLoader
          results={ searchResults }
          loadMore={ () => { setResultCursor(searchResults.length + 10); } }
        />
      </div>
    ) : (
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
        <img src={ macros.isMobile ? logoSmall : logo } className='Results_Logo' alt='logo' onClick={ () => { history.push('/'); } } />
        <div className='Results_InputWrapper'>
          <SearchBar
            className='Results_Input'
            onSearch={ (val) => {
              setResultCursor(5);
              history.push(`/${termId}/${val}`);
            } }
            query={ query }
            renderButton={ () => {
              return !macros.isMobile && (
                <>
                  <div className='Results_InputButton' role='button' tabIndex={ 0 }>
                    <img
                      src={ logoInput }
                      className='Results_InputLogo'
                      alt='logo'
                    />
                  </div>
                </>
              );
            } }
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

        <ResultsFooter />
      </div>
    </>

  );
}
