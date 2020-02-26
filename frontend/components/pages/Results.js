import React, { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Dropdown } from 'semantic-ui-react';
import logo from '../images/logo.svg';
import logoSmall from '../images/logo_small.svg';
import search from '../search';
import macros from '../macros';
import ResultsLoader from '../ResultsLoader';
import SearchBar from '../ResultsPage/SearchBar';


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
    text: 'SP20',
    value: '202030',
  },
  {
    text: 'F19',
    value: '202010',
  },
  {
    text: 'SI19',
    value: '201940',
  },
  {
    text: 'SII19',
    value: '201960',
  },
  {
    text: 'SF19',
    value: '201950',
  },
  {
    text: 'SP19',
    value: '201930',
  },
];


export default function Results() {
  const { termId, query } = useParams();
  const [searchResults, setSearchResults] = useState([]);
  const [resultCursor, setResultCursor] = useState(5);
  const history = useHistory();

  const toggleForm = () => {
  };

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

          />
          {!macros.isMobile &&
          (
          <img
            src={ logoSmall }
            className='Results_InputLogo'
            alt='logo'
            // onClick={ (val) => {
            //   setResultCursor(5);
            //   history.push(`/${termId}/${val}`);
            // } }
            query={ query }
          />
          )}
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

        <div className='footer'>

          <div className='footer ui basic center aligned segment'>
         See an issue or want to add to this website? Fork it or create an issue on
            <a target='_blank' rel='noopener noreferrer' href='https://github.com/sandboxnu/searchneu'>
           &nbsp;GitHub
            </a>
         .
          </div>

          <div className='ui divider' />

          <div className='footer ui basic center aligned segment credits'>
         A&nbsp;
            <a target='_blank' rel='noopener noreferrer' href='https://www.sandboxneu.com'>
           Sandbox
            </a>
         &nbsp;Project (founded by&nbsp;
            <a target='_blank' rel='noopener noreferrer' href='http://github.com/ryanhugh'>
           Ryan Hughes
            </a>
         , with some awesome&nbsp;
            <a target='_blank' rel='noopener noreferrer' href='https://github.com/sandboxnu/searchneu/graphs/contributors'>
           contributors
            </a>
         )
          </div>
          <div className='footer ui basic center aligned segment affiliation'>
         Search NEU is built for students by students & is not affiliated with NEU.
          </div>
          <div className='footer ui basic center aligned segment contact'>
            <a role='button' tabIndex={ 0 } onClick={ toggleForm }>
           Feedback
            </a>
         &nbsp;•&nbsp;
            <a role='button' tabIndex={ 0 } onClick={ toggleForm }>
           Report a bug
            </a>
         &nbsp;•&nbsp;
            <a role='button' tabIndex={ 0 } onClick={ toggleForm }>
           Contact
            </a>
          </div>

        </div>
      </div>
    </>

  );
}
