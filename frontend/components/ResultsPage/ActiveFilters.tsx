import React from 'react';
import _ from 'lodash';
import { FilterSelection } from '../types';

interface BreadcrumbProps {
  category: string,
  state: string,
  onClose: () => void,
}

function FilterBreadcrumb({ category, state, onClose }: BreadcrumbProps) {
  return (
    <div className='FilterBreadcrumb'>
      <button
        className='FilterBreadcrumb__close'
        type='button'
        onClick={ onClose }
      >
        <span className='FilterBreacrumb__category'>
          {`${category}: `}
        </span>
        {state}
        <span className='FilterBreadcrumb__icon' />
      </button>
    </div>
  )
}

interface ActiveFiltersProps {
  filters: FilterSelection
  setFilters: (f: FilterSelection) => void
}

type FilterCategorySpecification = {key:string, display:string};

const OPTION_CATEGORIES: FilterCategorySpecification[] = [
  { key:'NUpath', display:'NU Path' },
  { key:'subject', display:'Subject' },
  { key:'classType', display:'Class Type' },
];

const BOOLEAN_CATEGORIES: FilterCategorySpecification[] = [
  { key: 'online', display: 'Only Online' },
  { key: 'showUnavailable', display: 'Show Unavailable' },
]

export default function ActiveFilters({ filters, setFilters }: ActiveFiltersProps) {
  const crumbs: BreadcrumbProps[] = [];

  // Add all the selected option filters
  for (const { display, key } of OPTION_CATEGORIES) {
    for (const s of filters[key]) {
      crumbs.push({
        category: display,
        state: s,
        onClose: () => setFilters({ [key]: _.without(filters[key], s) }),
      });
    }
  }

  for (const { display, key } of BOOLEAN_CATEGORIES) {
    if (filters[key]) {
      crumbs.push({
        category: '',
        state: display,
        onClose: () => setFilters({ [key]: false }),
      })
    }
  }

  if (crumbs.length > 0) {
    return (
      <div className='applied-filters'>
        <span className='applied-filters__label'>
          Applied ({filters.NUpath.length}):
        </span>
        <div className='applied-filters__row'>
          {
          crumbs.map((crumb: BreadcrumbProps) => (
            <FilterBreadcrumb
              category={ crumb.category }
              state={ crumb.state }
              onClose={ crumb.onClose }
            />
          ))
        }
        </div>
      </div>
    )
  }
  return null;
}
