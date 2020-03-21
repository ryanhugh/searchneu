import React from 'react';
import _ from 'lodash';
import { FilterSelection } from '../types';
import FilterBreadcrumb from './FilterBreadcrumb';

interface ActiveFilters {
  filters: FilterSelection
  setFilters: (f: FilterSelection) => void
}

interface Breadcrumb {
  name: string,
  onClose: () => void,
}

export default function ActiveFilters({ filters, setFilters }: ActiveFilters) {
  let crumbs: Breadcrumb[] = [];
  const nupaths = filters.NUpath.map((s: string) => (
    { name: `NU Path: ${s}`, onClose: () => setFilters({ NUpath: _.without(filters.NUpath, s) }) }
  ));
  crumbs = crumbs.concat(nupaths);

  if (crumbs.length > 0) {
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
  return null;
}
