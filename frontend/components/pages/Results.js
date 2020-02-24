import React, { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Dropdown } from 'semantic-ui-react';
import logo from '../images/logo.svg';
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

export default function Results() {
  const { termId, query } = useParams();
  //   const [searchQuery, setSearchQuery] = useState(query);
  //   const [selectedTermId, setSelectedTermId] = useState(termId);
  const [searchResults, setSearchResults] = useState([]);
  const history = useHistory();
  const searchQuery = query;
  const selectedTermId = termId;


  const callSearch = async (queryToSearch, termIdToSearch, termCount = 5) => {
    const currentQueryAndTerm = queryToSearch + termIdToSearch;

    const obj = await search.search(queryToSearch, termIdToSearch, termCount);
    const results = obj.results;


    if ((searchQuery + selectedTermId) !== currentQueryAndTerm) {
      macros.log('Did not come back in order, discarding ', currentQueryAndTerm, '!==', queryToSearch, termIdToSearch);
      return;
    }


    setSearchResults(results);
    console.log(`searching for ${queryToSearch} in ${termIdToSearch}`);
  };


  const onTermdropdownChange = (event, data) => {
    console.log('selectedTermId', data.value);
    // setSelectedTermId(data.value);
    history.push(`/${data.value}/${searchQuery}`);
  };
  const onLogoClick = () => {
    history.push('/');
  };

  const loadMore = () => {
    callSearch(searchQuery, selectedTermId, searchResults.length + 10);
  };

  const toggleForm = () => {
  };

  useEffect(() => {
    console.log('termId and searchQuery ', termId, query);
    callSearch(searchQuery, selectedTermId);
  }, [searchQuery, selectedTermId]);

  const resultsElement = () => {
    return searchResults.length ? (
      <div>
        <div className='subjectContaineRowContainer'>
          {/* {subjectInfoRow} */}
        </div>
        <ResultsLoader
          results={ searchResults }
          loadMore={ loadMore }
        />
      </div>
    ) : (
      <div className='noResultsContainer'>
        <h3>
            No Results
        </h3>
        <div className='noResultsBottomLine'>
            Want to&nbsp;
          <a target='_blank' rel='noopener noreferrer' href={ `https://google.com/search?q=${macros.collegeName} ${searchQuery}` }>
              search for&nbsp;
            <div className='ui compact segment noResultsInputText'>
              <p>
                {searchQuery}
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
        <SearchBar
          onSearch={ (val) => { return history.push(`/${selectedTermId}/${val}`); } }
          query={ searchQuery }
        />
        <Dropdown
          selection
          defaultValue={ selectedTermId }
          placeholder='Spring 2018'
          className='Results_TermDropDown'
          options={ termDropDownOptions }
          onChange={ onTermdropdownChange }
        />
        <img src={ logo } className='Results_Logo' alt='logo' onClick={ onLogoClick } />
      </div>
      <div className='resultsContainer'>
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
