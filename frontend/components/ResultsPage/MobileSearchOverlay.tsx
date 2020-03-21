import React from 'react';
import { FilterSelection } from '../types';
import SearchBar from './SearchBar';
import FilterPanel from './FilterPanel';
import { FilterOptions } from './filterTypes';
import ActiveFilters from './ActiveFilters';
import backIcon from '../images/back_icon.svg';

interface MobileSearchOverlayProps {
  setActiveFilters: (f: FilterSelection) => void,
  setQuery: (q: string) => void,
  activeFilters: FilterSelection,
  filterOptions: FilterOptions,
  query: string,
}

export default function MobileSearchOverlay({
  setActiveFilters, setQuery, activeFilters, filterOptions, query,
}: MobileSearchOverlayProps) {
  return (
    <div className='msearch-overlay'>
      <div className='Results_Header Results_Header-top msearch-overlay__topbar'>
        <img
          src={ backIcon }
          className='msearch-overlay__back'
          alt='back'
          onClick={ () => setQuery(query) }
        />
        <div className='msearch-overlay__search'>
          <SearchBar
            query={ query }
            onSearch={ setQuery }
            autoFocus
          />
        </div>
      </div>
      <div className='msearch-overlay__content'>
        <div className='msearch-overlay__active'>
          <ActiveFilters
            filters={ activeFilters }
            setFilters={ setActiveFilters }
          />
        </div>
        <FilterPanel
          options={ filterOptions }
          active={ activeFilters }
          setActive={ setActiveFilters }
        />
      </div>
    </div>
  )
}
