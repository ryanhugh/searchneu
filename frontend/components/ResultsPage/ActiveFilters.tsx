import React from 'react';
import _ from 'lodash';
import { FilterSelection } from '../types';

interface BreadcrumbProps {
  verbose: string, // for desktop
  compact: string, // for mobile
  onClose: () => void,
}

function FilterBreadcrumb({ verbose, compact, onClose }: BreadcrumbProps) {
  return (
    <div className='FilterBreadcrumb'>
      <button
        className='FilterBreadcrumb__close'
        type='button'
        onClick={ onClose }
      >
        <span className='FilterBreadcrumb__verbose'>
          {verbose}
        </span>
        <span className='FilterBreadcrumb__compact'>
          {compact}
        </span>
        <span className='FilterBreadcrumb__icon' />
      </button>
    </div>
  )
}

interface ActiveFiltersProps {
  filters: FilterSelection
  setFilters: (f: FilterSelection) => void
}

type FilterCategorySpecification = { key: string, display: string };

const OPTION_CATEGORIES: FilterCategorySpecification[] = [
  { key: 'NUpath', display: 'NU Path' },
  { key: 'subject', display: 'Subject' },
  { key: 'classType', display: 'Class Type' },
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
        verbose: `${display}: ${s}`,
        compact: s,
        onClose: () => setFilters({ [key]: _.without(filters[key], s) }),
      });
    }
  }

  for (const { display, key } of BOOLEAN_CATEGORIES) {
    if (filters[key]) {
      crumbs.push({
        verbose: display,
        compact: display,
        onClose: () => setFilters({ [key]: false }),
      })
    }
  }

  return (
    <div className='active-filters'>
      {crumbs.length > 0
         && (
         <span className='active-filters__label'>
           Applied ({crumbs.length})
         </span>
         )}
      <div className='active-filters__row'>
        {
          crumbs.map((crumb: BreadcrumbProps) => (
            <FilterBreadcrumb
              verbose={ crumb.verbose }
              compact={ crumb.compact }
              onClose={ crumb.onClose }
            />
          ))
        }
      </div>
    </div>
  )
}
