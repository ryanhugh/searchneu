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
  online: FilterCategories.Toggle,
  // showUnavailable: FilterCategories.Toggle,
  nupath: FilterCategories.Dropdown,
  subject: FilterCategories.Dropdown,
  classType: FilterCategories.Checkboxes,
}
type FilterSpecs = typeof FILTER_SPECS;
// Represents additional info for each filter
type FilterInfo<T> = {[K in keyof FilterSpecs]: T}

// Represents which categories of filters have "options" (multiple choice)
type FilterCategoriesWithOptions = 'Dropdown' | 'Checkboxes';

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
export const QUERY_PARAM_ENCODERS: FilterInfo<QueryParamConfig<any, any>> = _.mapValues(FILTER_SPECS, (cat: FilterCategory) => ENCODERS_FOR_CAT[cat]);
export const DEFAULT_PARAMS: FilterInfo<false | []> = _.mapValues(FILTER_SPECS, (cat: FilterCategory) => DEFAULTS_FOR_CAT[cat]);
export const FILTER_DISPLAY_TEXT: FilterInfo<string> = {
  subject: 'Subject',
  nupath: 'NU Path',
  online: 'Online Classes Only',
  classType: 'Class Type',
}
export const FILTER_ORDER = ['subject', 'nupath', 'online', 'classType'];
export const FILTERS_BY_CATEGORY: Record<FilterCategory, string[]> = _.mapValues(FilterCategories, (cat: FilterCategory) => {
  return Object.keys(_.pickBy(FILTER_SPECS, (c:FilterCategory) => c === cat));
});
