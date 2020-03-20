import React from 'react';
import _ from 'lodash';
import { FilterSelection } from '../types';
import FilterBreadcrumb from './FilterBreadcrumb';

interface AppliedFiltersProps {
  filters: FilterSelection
  setFilters: (f:FilterSelection) => void
}

export default function AppliedFilters({ filters, setFilters }: AppliedFiltersProps) {
  return (
    <div className='AppliedFilters'>
      {
        filters.NUpath.map((selection:string) => (
          <FilterBreadcrumb
            name={ `NU Path: ${selection}` }
            onClose={ () => setFilters({ NUpath: _.without(filters.NUpath, selection) }) }
          />
        ))
      }
    </div>
  )
}
