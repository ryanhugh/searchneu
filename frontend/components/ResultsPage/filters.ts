/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 *
 * Types and constants for filters. One source of truth for frontend filters
 */

import { QueryParamConfig, BooleanParam, ArrayParam } from 'use-query-params';
import _ from 'lodash';

// Neat utility to get a union type of the keys of T that extend type U.
type FilteredKeys<T, U> = { [P in keyof T]: T[P] extends U ? P : never }[keyof T];
// Get union type of the values of type T
type ValueOf<T> = T[keyof T];


// ============== Filter categories ================
// Filter categoriesrepresents the different categories of filters that are possible
export const FilterCategories = {
  Toggle: 'Toggle' as 'Toggle',
  Dropdown: 'Dropdown' as 'Dropdown',
  Checkboxes: 'Checkboxes' as 'Checkboxes',
}
export type FilterCategory = ValueOf<typeof FilterCategories>;

// Query param encoders for each category of filter
const ENCODERS_FOR_CAT: Record<FilterCategory, QueryParamConfig<any, any>> = {
  Toggle: BooleanParam,
  Dropdown: ArrayParam,
  Checkboxes: ArrayParam,
}

// Default values for each category of filter
const DEFAULTS_FOR_CAT: Record<FilterCategory, any> = {
  Toggle: false,
  Dropdown: [],
  Checkboxes: [],
};

// ============== Filter specifications ================
// Specify which filters exist, and which category they are
export const FILTER_SPECS = {
  online: { category: FilterCategories.Toggle, display: 'Online Classes Only', order: 3 },
  nupath: { category: FilterCategories.Dropdown, display: 'NU Path', order: 2 },
  subject: { category: FilterCategories.Dropdown, display: 'Subject', order: 1 },
  classType: { category: FilterCategories.Checkboxes, display: 'Class Type', order: 4 },
}
// A specification for a filter of category C. Needed for conditional types
type FilterSpec<C> = {
  category: C,
  display: string,
  order: number
}
type FilterSpecs = typeof FILTER_SPECS;
// Represents additional info for each filter
type FilterInfo<T> = {[K in keyof FilterSpecs]: T}

// Represents which categories of filters have "options" (multiple choice)
type FilterCategoriesWithOptions = FilterSpec<'Dropdown'> | FilterSpec<'Checkboxes'>;

// Union type of filters that have options
type FiltersWithOptions = FilteredKeys<FilterSpecs, FilterCategoriesWithOptions>;


// ============== Types For Components To Use ================
// Represents which filters were selected by a user.
export type FilterSelection = {[K in keyof FilterSpecs]?: FilterSpecs[K] extends FilterCategoriesWithOptions ? string[] : boolean}

// Represents the options for all filters
export type FilterOptions = {[K in FiltersWithOptions]: Option[]}

export type Option = {
  value: string,
  count: number
}

// ============== Constants For Components To Use ================
export const QUERY_PARAM_ENCODERS: FilterInfo<QueryParamConfig<any, any>> = _.mapValues(FILTER_SPECS, (spec) => ENCODERS_FOR_CAT[spec.category]);
export const DEFAULT_FILTER_SELECTION: FilterSelection = _.mapValues(FILTER_SPECS, (spec) => DEFAULTS_FOR_CAT[spec.category]);
export const FILTERS_BY_CATEGORY: Record<FilterCategory, Partial<FilterSpecs>> = _.mapValues(FilterCategories, (cat: FilterCategory) => {
  return _.pickBy(FILTER_SPECS, (spec) => spec.category === cat);
});
export const FILTERS_IN_ORDER = _(FILTER_SPECS).toPairs()
  .map(([key, spec]) => ({ key, ...spec }))
  .sortBy(['order'])
  .value();
export const areFiltersSet = (f: FilterSelection) => !_.isMatch(DEFAULT_FILTER_SELECTION, f);
