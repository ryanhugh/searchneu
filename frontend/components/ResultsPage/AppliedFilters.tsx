import React from 'react';
import _ from 'lodash';
import { FilterSelection } from '../types';
import FilterBreadcrumb from './FilterBreadcrumb';

interface AppliedFiltersProps {
  filters: FilterSelection
  setFilters: (f: FilterSelection) => void
}

interface Breadcrumb {
  name: string,
  onClose: () => void,
}

export default function AppliedFilters({ filters, setFilters }: AppliedFiltersProps) {
  let crumbs: Breadcrumb[] = [];
  const nupaths = filters.NUpath.map((s: string) => (
    { name: `NU Path: ${s}`, onClose: () => setFilters({ NUpath: _.without(filters.NUpath, s) }) }
  ));
  crumbs = crumbs.concat(nupaths);
  return (
    <div className='applied-filters'>
      <span className='applied-filters__label'>
        Applied ({filters.NUpath.length}):
      </span>
      <div className='applied-filters__row'>
        {
          crumbs.map((crumb: Breadcrumb) => (
            <FilterBreadcrumb
              name={ crumb.name }
              onClose={ crumb.onClose }
            />
          ))
        }
      </div>
    </div>
  )
}
