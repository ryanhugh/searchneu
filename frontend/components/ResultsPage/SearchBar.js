import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import macros from '../macros';

/**
 * Component to handle the searchbar input. Abstracts the jankiness of controlling input components.
 */
export default function SearchBar({
  query, onSearch, className, renderButton,
}) {
  // controlledQuery represents what's typed into the searchbar - even BEFORE enter is hit
  const [controlledQuery, setControlledQuery] = useState(query);

  // Keep the controlledQuery in sync with the query prop (eg. browser popState)
  useEffect(() => {
    setControlledQuery(query);
  }, [query]);

  // Hide keyboard and execute search
  const search = () => {
    if (macros.isMobile) {
      if (document.activeElement) {
        document.activeElement.blur();
      }
    }
    onSearch(controlledQuery);
  };

  return (
    <>
      <input
        type='search'
        id='search_id'
        autoComplete='off'
        spellCheck='false'
        tabIndex='0'
        className={ className }
        onKeyDown={ (event) => {
          if (event.key === 'Enter') {
            search();
          }
        } }
        onChange={ (event) => { setControlledQuery(event.target.value); } }
        value={ controlledQuery }
      />
      {renderButton
      && (
      <div onClick={ search } role='button' tabIndex={ 0 }>
        {renderButton()}
      </div>
      )}
    </>
  );
}

SearchBar.propTypes = {
  className: PropTypes.string,
  query: PropTypes.string.isRequired,
  onSearch: PropTypes.func.isRequired,
  renderButton: PropTypes.func,
};

SearchBar.defaultProps = {
  className: '',
  renderButton: null,
};
