/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import elastic from './elastic';
import { Course, Section } from './database/models/index';
import HydrateSerializer from './database/serializers/hydrateSerializer';
import macros from './macros';

class Searcher {
  constructor() {
    this.elastic = elastic;
    this.subjects = null;
  }

  /**
   * Remove any invalid filter with the following criteria:
   * 1. Correct key string and value type;
   * 2. Check that { online: false } should never be in filters
   *
   * A sample filters JSON object has the following format:
   * { 'NUpath': string[],
   *   'college': string[],
   *   'subject': string[],
   *   'online': boolean,
   *   'classType': string }
   *
   * @param {object} filters The json object represting all filters on classes
   */
  validateFilters(filters) {
    const isString = (givenVar) => {
      return typeof givenVar === 'string';
    };

    const isStringArray = (givenVar) => {
      return Array.isArray(givenVar) && givenVar.every((eachVar) => isString(eachVar));
    };

    const isTrue = (givenVar) => {
      return typeof givenVar === 'boolean' && givenVar;
    };

    const validFiltersFormat = {
      NUpath: isStringArray,
      college: isStringArray,
      subject: isStringArray,
      online: isTrue,
      classType: isString,
    };

    const validFilters = {};
    for (const [filterKey, filterValues] of Object.entries(filters)) {
      if (!(filterKey in validFiltersFormat)) {
        macros.log('Invalid filter key.', filterKey);
      } else if (!(validFiltersFormat[filterKey](filterValues))) {
        macros.log('Invalid filter value type.', filterKey);
      } else {
        validFilters[filterKey] = filterValues;
      }
    }
    return validFilters;
  }

  /**
   * Get elasticsearch query from json filters and termId
   * @param  {string}  termId  The termId to look within
   * @param  {object}  filters The json object representing all filters on classes
   */
  getClassFilterQuery(termId, filters) {
    const hasSectionsFilter = { exists: { field: 'sections' } };

    const termFilter = { term: { 'class.termId': termId } };

    const getNUpathFilter = (selectedNUpaths) => {
      const NUpathFilters = selectedNUpaths.map((eachNUpath) => ({ match_phrase: { 'class.classAttributes': eachNUpath } }));
      return { bool: { should: NUpathFilters } };
    };

    const getCollegeFilter = (selectedColleges) => {
      const collegeFilters = selectedColleges.map((eachCollege) => ({ match_phrase: { 'class.classAttributes': eachCollege } }));
      return { bool: { should: collegeFilters } };
    };

    const getSubjectFilter = (selectedSubjects) => {
      const subjectFilters = selectedSubjects.map((eachSubject) => ({ match: { 'class.subject': eachSubject } }));
      return { bool: { should: subjectFilters } };
    };

    // note that { online: false } is never in filters
    const getOnlineFilter = (selectedOnlineOption) => {
      return { term: { 'sections.online': selectedOnlineOption } };
    };

    const getClassTypeFilter = (selectedClassType) => {
      return { match: { 'class.scheduleType': selectedClassType } };
    };

    // construct compound class filters (fliters joined by AND (must), options for a filter joined by OR (should))
    const filterToEsQuery = {
      NUpath: getNUpathFilter,
      college: getCollegeFilter,
      subject: getSubjectFilter,
      online: getOnlineFilter,
      classType: getClassTypeFilter,
    };

    const classFilters = [hasSectionsFilter, termFilter];
    for (const [filterKey, filterValues] of Object.entries(filters)) {
      if (filterKey in filterToEsQuery) {
        classFilters.push(filterToEsQuery[filterKey](filterValues));
      }
    }

    return { bool:{ must: classFilters } };
  }

  /**
   * return a set of all existing subjects of classes
   */
  async getSubjects() {
    if (!this.subjects) {
      // can add plain: false if you want
      this.subjects = new Set((await Course.aggregate('subject', 'distinct', { plain: false })).map((hash) => hash.distinct));
    }
    return this.subjects;
  }

  /**
   * Search for classes and employees
   * @param  {string}  query  The search to query for
   * @param  {string}  termId The termId to look within
   * @param  {integer} min    The index of first document to retreive
   * @param  {integer} max    The index of last document to retreive
   */
  async search(query, termId, min, max, filters = {}) {
    // if we know that the query is of the format of a course code, we want to do a very targeted query against subject and classId: otherwise, do a regular query.
    const courseCodePattern = /^\s*([a-zA-Z]{2,4})\s*(\d{4})?\s*$/i;
    let fields = [
      'class.name^2', // Boost by 2
      'class.name.autocomplete',
      'class.subject^4',
      'class.classId^3',
      'sections.profs',
      'class.crns',
      'employee.name^2',
      'employee.emails',
      'employee.phone',
    ];

    const patternResults = query.match(courseCodePattern);
    if (patternResults && (await this.getSubjects()).has(patternResults[1].toLowerCase())) {
      // after the first result, all of the following results should be of the same subject, e.g. it's weird to get ENGL2500 as the second or third result for CS2500
      fields = ['class.subject^10', 'class.classId'];
    }

    // get compound class filters
    const validFilters = this.validateFilters(filters);
    const classFilters = this.getClassFilterQuery(termId, validFilters);

    // text query from the main search box
    const matchTextQuery = {
      multi_match: {
        query: query,
        type: 'most_fields', // More fields match => higher score
        fuzziness: 'AUTO',
        fields: fields,
      },
    };

    // use lower classId has tiebreaker after relevance
    const sortByClassId = { 'class.classId.keyword': { order: 'asc', unmapped_type: 'keyword' } };

    // filter by type employee
    const isEmployee = { term: { type: 'employee' } };

    // compound query for text query and filters
    const mainQuery = {
      sort: ['_score', sortByClassId],
      query: {
        bool: {
          must: matchTextQuery,
          filter: {
            bool: {
              should: [
                classFilters,
                isEmployee,
              ],
            },
          },
        },
      },
    };

    const searchOutput = await elastic.query(`${elastic.EMPLOYEE_INDEX},${elastic.CLASS_INDEX}`, min, max - min, mainQuery);

    const results = await (new HydrateSerializer(Section)).bulkSerialize(searchOutput.body.hits.hits);

    return {
      searchContent: results,
      resultCount: searchOutput.body.hits.total.value,
      took: searchOutput.body.took,
    };
  }
}

const instance = new Searcher();
export default instance;
