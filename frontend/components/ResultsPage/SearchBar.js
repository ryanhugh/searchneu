import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import macros from '../macros';

/**
 * Component to handle the searchbar input. Abstracts the jankiness of controlling input components.
 */
export default function SearchBar({ query, onSearch }) {
  // controlledQuery represents what's typed into the searchbar - even BEFORE enter is hit
  const [controlledQuery, setControlledQuery] = useState(query);

  // Keep the controlledQuery in sync with the query prop (eg. browser popState)
  useEffect(() => {
    setControlledQuery(query);
  }, [query]);

  const onKeyDown = (event) => {
    if (event.key !== 'Enter' || !event.target.value) {
      return;
    }

    if (macros.isMobile) {
      // Hide the keyboard on android phones.
      if (document.activeElement) {
        document.activeElement.blur();
      }
    }
    onSearch(event.target.value);
  };

  const onChange = (event) => {
    setControlledQuery(event.target.value);
  };

  return (
    <input
      type='search'
      id='search_id'
      autoComplete='off'
      spellCheck='false'
      tabIndex='0'
      className='Results_Input'
      onKeyDown={ onKeyDown }
      onChange={ onChange }
      value={ controlledQuery }
    />
  );
}

SearchBar.propTypes = {
  query: PropTypes.string.isRequired,
  onSearch: PropTypes.func.isRequired,
};
