/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 *
 * ONLY PUT COMMONLY USED TYPES HERE
 */


// ======= Search Results ========
// Represents the course and employee data returned by /search
export type Course = any; //TODO
export type Employee = any;
export type SearchItem = Course | Employee;


// Represents which filters were selected by a user.
export interface FilterSelection {
  online?: boolean,
  NUpath?: string[],
  subject?: string[],
  classType?: string[],
}
