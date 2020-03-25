/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 *
 * ONLY PUT COMMONLY USED TYPES HERE
 */

// ======= Search Results ========
// Represents the course and employee data returned by /search
export interface SearchResult {
  results: SearchItem[],
  filterOptions: FilterOptions,
}

export type Course = any; //TODO
export type Employee = any;
export type SearchItem = Course | Employee;

export function BLANK_SEARCH_RESULT(): SearchResult {
  return { results: [], filterOptions: { nupath: [], subject: [], classType: [] } }
}


// Represents which filters were selected by a user.
export interface FilterSelection {
  online?: boolean,
  showUnavailable?: boolean,
  nupath?: string[],
  subject?: string[],
  classType?: string[],
}

// Represents an option in a dropdown or checkbox filter
export type Option = {
  value: string,
  count: number
}

// represents the options for all filters
export type FilterOptions = {
  nupath: Option[],
  subject: Option[],
  classType: Option[],
}
