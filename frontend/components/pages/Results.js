import React, { useState, useEffect, useRef } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Dropdown } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import logo from '../images/logo.svg';
import search from '../search';
import macros from '../macros';


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
  const inputElement = useRef(null);
  const [searchQuery, setSearchQuery] = useState(query);
  const [selectedTermId, setSelectedTermId] = useState(termId);
  const history = useHistory();


  const callSearch = async (queryToSearch, termIdToSearch, termCount = 5) => {
    const currentQueryAndTerm = queryToSearch + termIdToSearch;

    const obj = await search.search(queryToSearch, termIdToSearch, termCount);
    const results = obj.results;


    if ((searchQuery + selectedTermId) !== currentQueryAndTerm) {
      macros.log('Did not come back in order, discarding ', currentQueryAndTerm, '!==', queryToSearch, termIdToSearch);
      return;
    }

    if (results.length === 0) {
      macros.logAmplitudeEvent('Frontend Search No Results', { query: searchQuery.toLowerCase(), sessionCount: searchCount });
    }
    console.log(`searching for ${queryToSearch} in ${termIdToSearch}`);
  };

  const onKeyDown = (event) => {
    if (event.key !== 'Enter') {
      return;
    }

    if (macros.isMobile) {
      // Hide the keyboard on android phones.
      if (document.activeElement) {
        document.activeElement.blur();
      }
    }
    console.log(`pushing /${selectedTermId}/${inputElement.current.value} to history`);
    setSearchQuery(inputElement.current.value);
    history.push(`/${selectedTermId}/${inputElement.current.value}`);
  };

  const onTermdropdownChange = (event, data) => {
    console.log('selectedTermId', data.value);
    setSelectedTermId(data.value);
  };
  const onLogoClick = () => {
    history.push('/');
  };

  useEffect(() => {
    console.log('termId and searchQuery ', termId, query);
    callSearch(searchQuery, selectedTermId);
  }, [searchQuery, selectedTermId]);


  return (
    <div className='Results'>
      <input
        type='search'
        id='search_id'
        autoComplete='off'
        spellCheck='false'
        tabIndex='0'
        className='Results_Input'
        onKeyDown={ onKeyDown }
        defaultValue={ searchQuery }
        ref={ inputElement }
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

  );
}
