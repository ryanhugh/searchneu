/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */
import React, { useState, useEffect } from 'react';
import macros from '../macros';
import logoInput from '../images/logo_input.svg';

interface SearchBarProps {
  query: string,
  onSearch: (q: string) => void,
  onClick?: () => void,
  autoFocus?: boolean,
}

/**
 * Component to handle the searchbar input. Abstracts the jankiness of controlling input components.
 */
export default function SearchBar({
  query, onSearch, onClick, autoFocus = !macros.isMobile,
}: SearchBarProps) {
  // controlledQuery represents what's typed into the searchbar - even BEFORE enter is hit
  const [controlledQuery, setControlledQuery] = useState(query);

  // Keep the controlledQuery in sync with the query prop (eg. browser popState)
  useEffect(() => {
    setControlledQuery(query);
  }, [query]);

  // Hide keyboard and execute search
  const search = () => {
    if (macros.isMobile) {
      if (document.activeElement && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
    onSearch(controlledQuery);
  };

  return (
    <div className='searchbar'>
      <input
        type='search'
        id='search_id'
        autoComplete='off'
        spellCheck='false'
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={ autoFocus }
        tabIndex={ 0 }
        className='searchbar__input'
        size={ 10 }
        onKeyDown={ (event) => {
          if (event.key === 'Enter') {
            search();
          }
        } }
        onClick={ onClick }
        onChange={ (event) => { setControlledQuery(event.target.value); } }
        value={ controlledQuery }
        placeholder={ !macros.isMobile && 'Class, professor, course number' }
      />
      <div onClick={ search } className='searchbar__button' role='button' tabIndex={ 0 }>
        <img
          src={ logoInput }
          className='searchbar__button-logo'
          alt='logo'
        />
      </div>
    </div>
  );
}
