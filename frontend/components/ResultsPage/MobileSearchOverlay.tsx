import React, { useState, useEffect } from 'react';
import { FilterSelection } from '../types';
import FilterPanel from './FilterPanel';
import { FilterOptions } from './filterTypes';
import FilterPills from './FilterPills';
import macros from '../macros';
import LogoInput from '../images/LogoInput';
import IconClose from '../images/IconClose';

/**
 * setFilterPills sets the active filters
 * setQuery sets the search query from the searchbar
 * onExecute indicates the query should be run and we should return to the results page
 * onClose indicates the user wants to close the overlay and return to wherever we were before
 * activeFilters is the list of active filters
 * filterOptions is the available options for the filters
 * query is the search query
 */
interface MobileSearchOverlayProps {
  setFilterPills: (f: FilterSelection) => void,
  setQuery: (q: string) => void,
  onExecute: () => void,
  activeFilters: FilterSelection,
  filterOptions: FilterOptions,
  query: string,
}

export default function MobileSearchOverlay({
  setFilterPills, setQuery, activeFilters, filterOptions, query, onExecute,
}: MobileSearchOverlayProps) {
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
    setQuery(controlledQuery);
    onExecute();
  };
  return (
    <div className='msearch-overlay'>
      <div className='Results_Header Results_Header-top msearch-overlay__topbar'>
        <div
          className='msearch-overlay__back'
          role='button'
          tabIndex={ 0 }
          onClick={ search }
        >
          <IconClose fill='#d41b2c' />
        </div>
        <div className='overlay-search'>
          <input
            type='search'
            id='search_id'
            autoComplete='off'
            spellCheck='false'
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            tabIndex={ 0 }
            className='overlay-search__input'
            size={ 10 }
            onKeyDown={ (event) => {
              if (event.key === 'Enter') {
                search();
              }
            } }
            onChange={ (event) => { setControlledQuery(event.target.value); } }
            value={ controlledQuery }
            placeholder={ !macros.isMobile ? 'Class, professor, course number' : undefined }
          />
          <div onClick={ search } className='overlay-search__button' role='button' tabIndex={ 0 }>
            <LogoInput fill='#d41b2c' />
          </div>
        </div>
      </div>
      <div className='msearch-overlay__content'>
        <div className='msearch-overlay__pills'>
          <FilterPills
            filters={ activeFilters }
            setFilters={ setFilterPills }
          />
        </div>
        <FilterPanel
          options={ filterOptions }
          active={ activeFilters }
          setActive={ setFilterPills }
        />
      </div>
      <div
        tabIndex={ 0 }
        className='msearch-overlay__execute'
        onClick={ search }
        role='button'
      >
        View all results
      </div>
    </div>
  )
}
