/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import _ from 'lodash';
import elastic from './elastic';
import { Course, Section } from './database/models/index';
import HydrateSerializer from './database/serializers/hydrateSerializer';
import macros from './macros';

class Searcher {
  constructor() {
    this.elastic = elastic;
    this.subjects = null;
    this.filters = Searcher.generateFilters();
    this.aggFilters = _.pickBy(this.filters, (f) => !!f.agg);
  }

  static generateFilters() {
    // type validating functions
    const isString = (arg) => {
      return typeof arg === 'string';
    };

    const isStringArray = (arg) => {
      return Array.isArray(arg) && arg.every((elem) => isString(elem));
    };

    const isTrue = (arg) => {
      return typeof arg === 'boolean' && arg;
    };

    // filter-generating functions
    const getSectionsAvailableFilter = () => {
      return { exists: { field: 'sections' } };
    };

    // TODO just use the terms query!!!!!!! wtfff
    const getNUpathFilter = (selectedNUpaths) => {
      return { terms: { 'class.nupath.keyword': selectedNUpaths } };
    };

    const getSubjectFilter = (selectedSubjects) => {
      return { terms: { 'class.subject.keyword': selectedSubjects } };
    };

    // note that { online: false } is never in filters
    const getOnlineFilter = (selectedOnlineOption) => {
      return { term: { 'sections.online': selectedOnlineOption } };
    };

    const getClassTypeFilter = (selectedClassTypes) => {
      return { terms: { 'sections.classType.keyword': selectedClassTypes } };
    };

    const getTermIdFilter = (selectedTermId) => {
      return { term: { 'class.termId': selectedTermId } };
    };

    return {
      nupath: { validate: isStringArray, create: getNUpathFilter, agg: 'class.nupath.keyword' },
      subject: { validate: isStringArray, create: getSubjectFilter, agg: 'class.subject.keyword' },
      online: { validate: isTrue, create: getOnlineFilter, agg: false },
      classType: { validate: isStringArray, create: getClassTypeFilter, agg: 'sections.classType.keyword' },
      sectionsAvailable: { validate: isTrue, create: getSectionsAvailableFilter, agg: false },
      termId: { validate: isString, create: getTermIdFilter, agg: false },
    };
  }

  async initializeSubjects() {
    if (!this.subjects) {
      this.subjects = new Set((await Course.aggregate('subject', 'distinct', { plain: false })).map((hash) => hash.distinct));
    }
  }

  /**
   * return a set of all existing subjects of classes
   */
  getSubjects() {
    return this.subjects;
  }

  /**
   * Remove any invalid filter with the following criteria:
   * 1. Correct key string and value type;
   * 2. Check that { online: false } should never be in filters
   *
   * A sample filters JSON object has the following format:
   * { 'nupath': string[],
   *   'college': string[],
   *   'subject': string[],
   *   'online': boolean,
   *   'classType': string }
   *
   * @param {object} filters The json object represting all filters on classes
   */
  validateFilters(filters) {
    const validFilters = {};
    Object.keys(filters).forEach((currFilter) => {
      if (!(currFilter in this.filters)) macros.log('Invalid filter key.', currFilter);
      else if (!(this.filters[currFilter].validate(filters[currFilter]))) macros.log('Invalid filter value type.', currFilter);
      else validFilters[currFilter] = filters[currFilter];
    });
    return validFilters;
  }

  getFields(query) {
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
    if (patternResults && (this.getSubjects()).has(patternResults[1].toLowerCase())) {
      // after the first result, all of the following results should be of the same subject, e.g. it's weird to get ENGL2500 as the second or third result for CS2500
      fields = ['class.subject^10', 'class.classId'];
    }

    return fields;
  }

  /**
   * Get elasticsearch query
   */
  generateQuery(query, termId, userFilters, min, max, aggregation) {
    const fields = this.getFields(query);

    // text query from the main search box
    const matchTextQuery = query.length > 0
      ? {
        multi_match: {
          query: query,
          type: 'most_fields', // More fields match => higher score
          fuzziness: 'AUTO',
          fields: fields,
        },
      }
      : {
        match_all: {},
      };

    // use lower classId has tiebreaker after relevance
    const sortByClassId = { 'class.classId.keyword': { order: 'asc', unmapped_type: 'keyword' } };

    // filter by type employee
    const isEmployee = { term: { type: 'employee' } };
    const areFiltersApplied = Object.keys(userFilters).length > 0;
    const requiredFilters = { termId: termId, sectionsAvailable: true };
    const filters = { ...requiredFilters, ...userFilters };

    const classFilters = _(filters).pick(Object.keys(this.filters)).toPairs().map(([key, val]) => this.filters[key].create(val))
      .value();

    macros.log(classFilters);
    // very likely this doesn't work
    const aggQuery = !aggregation ? undefined : {
      [aggregation]: {
        terms: { field: this.filters[aggregation].agg },
      },
    };

    // compound query for text query and filters
    return {
      from: min,
      size: max - min,
      sort: ['_score', sortByClassId],
      query: {
        bool: {
          must: matchTextQuery,
          filter: {
            bool: {
              should: [
                { bool: { must: classFilters } },
                ...(!areFiltersApplied) ? [isEmployee] : [],
              ],
            },
          },
        },
      },
      aggregations: aggQuery,
    };
  }

  generateMQuery(query, termId, min, max, filters) {
    const validFilters = this.validateFilters(filters);

    const queries = [this.generateQuery(query, termId, validFilters, min, max)];

    for (const fKey of Object.keys(this.aggFilters)) {
      const everyOtherFilter = _.omit(filters, fKey);
      queries.push((this.generateQuery(query, termId, everyOtherFilter, 0, 0, fKey)));
    }
    return queries;
  }

  async getSearchResults(query, termId, min, max, filters) {
    const queries = this.generateMQuery(query, termId, min, max, filters);
    const results = await elastic.mquery(`${elastic.CLASS_INDEX},${elastic.EMPLOYEE_INDEX}`, queries);
    macros.log('es results')
    macros.log(JSON.stringify(results, null, 2));
    return this.parseResults(results.body.responses, Object.keys(this.aggFilters));
  }

  parseResults(results, filters) {
    return {
      output: results[0].hits.hits,
      resultCount: results[0].hits.total.value,
      took: results[0].took,
      aggregations: _.fromPairs(filters.map((filter, idx) => {
        return [filter, results[idx + 1].aggregations[filter].buckets.map((aggVal) => { return { value: aggVal.key, count: aggVal.doc_count } })];
      })),
    };
  }

  /**
   * Search for classes and employees
   * @param  {string}  query  The search to query for
   * @param  {string}  termId The termId to look within
   * @param  {integer} min    The index of first document to retreive
   * @param  {integer} max    The index of last document to retreive
   */
  async search(query, termId, min, max, filters = {}) {
    await this.initializeSubjects();
    const {
      output, resultCount, took, aggregations,
    } = await this.getSearchResults(query, termId, min, max, filters);
    const results = await (new HydrateSerializer(Section)).bulkSerialize(output);

    return {
      searchContent: results,
      resultCount,
      took,
      aggregations,
    };
  }
}

const instance = new Searcher();
export default instance;
