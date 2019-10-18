/* eslint-disable no-underscore-dangle */
/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import { Client } from '@elastic/elasticsearch';
import _ from 'lodash';
import macros from './macros';

const URL = macros.getEnvVariable('elasticURL') || 'http://localhost:9200';
const client = new Client({ node: URL });

class Elastic {
  constructor() {
    // Because we export an instance of this class, put the constance on the instance.
    this.CLASS_INDEX = 'classes';
    this.EMPLOYEE_INDEX = 'employees';
  }

  async isConnected() {
    try {
      await client.ping();
    } catch (err) {
      return false;
    }
    return true;
  }

  /**
   * @param  {string} indexName The index to insert into
   * @param  {Object} mapping   The new elasticsearch index mapping(schema)
   */
  async resetIndex(indexName, mapping) {
    // Clear out the index.
    await client.indices.delete({ index: indexName }).catch(() => {});
    // Put in the new classes mapping (elasticsearch doesn't let you change mapping of existing index)
    await client.indices.create({
      index: indexName,
      body: mapping,
    });
  }

  /**
   * Bulk index a collection of documents using ids from hashmap
   * @param  {string} indexName The index to insert into
   * @param  {Object} map       A map of document ids to document sources to create
   */
  async bulkIndexFromMap(indexName, map) {
    let promises = Promise.resolve();
    for (const part of _.chunk(Object.keys(map), 100)) {
      const bulk = [];
      for (const id of part) {
        bulk.push({ index: { _id: id } });
        bulk.push(map[id]);
      }
      promises = promises.then(() => { return client.bulk({ index: indexName, body: bulk }); });
    }
    return promises;
  }

  /**
   * Bulk update a collection of documents using ids from hashmap
   * @param  {string} indexName The index to update into
   * @param  {Object} map       A map of document ids to document sources to update
   */
  async bulkUpdateFromMap(indexName, map) {
    const bulk = [];
    for (const id of Object.keys(map)) {
      bulk.push({ update: { _id: id } });
      bulk.push({ doc: map[id] });
    }
    await client.bulk({ index: indexName, body: bulk });
  }

  /**
   * Get document by id
   * @param  {string} indexName Index to get from
   * @param  {string} id        ID to get
   * @return {Object} document source
   */
  async get(indexName, id) {
    return (await client.get({ index: indexName, type: '_doc', id: id })).body._source;
  }

  /**
   * Get a hashmap of ids to documents from a list of ids
   * @param  {string} indexName Index to get from
   * @param  {Array}  ids       Array of string ids to get
   * @return {Object} The map between doc ids and doc source
   */
  async getMapFromIDs(indexName, ids) {
    const got = await client.mget({
      index: indexName,
      type: '_doc',
      body: {
        ids: ids,
      },
    });
    return got.body.docs.reduce((result, doc) => {
      if (doc.found) {
        result[doc._id] = doc._source;
      }
      return result;
    }, {});
  }

  async getSubjectsFromClasses() {
    const subjects = await client.search({
      index: `${this.CLASS_INDEX}`,
      body: {
        aggs: {
          subjects: {
            terms: {
              field: "subject.keyword",
            },
          },
        },
      },
    });
    console.log(subjects.body.aggregations.subjects);
  }

  /**
   * Search for classes and employees
   * @param  {string}  query  The search to query for
   * @param  {string}  termId The termId to look within
   * @param  {integer} min    The index of first document to retreive
   * @param  {integer} max    The index of last document to retreive
   */
  async search(query, termId, min, max) {
    // if we know that the query is of the format of a course code, we want to do a very targeted query against subject and classId: otherwise, do a regular query.
    let courseCodePattern = /^\s*\w{2,4}\s*\d{4}?\s*$/i
      // /^(\s)*\w\w(\w?)(\w?)(\s)*(\d\d\d\d)?(\s)*$/i;
    let fields = [
      'class.name^2', // Boost by 2
      'class.name.autocomplete',
      'class.subject^4',
      'class.classId^3',
      'sections.meetings.profs',
      'class.crns',
      'employee.name^2',
      'employee.emails',
      'employee.phone',
    ];

    if (courseCodePattern.test(query)) {
      // after the first result, all of the following results should be of the same subject, e.g. it's weird to get ENGL2500 as the second or third result for CS2500
      fields = ['class.subject^10', 'class.classId'];
    }

    const searchOutput = await client.search({
      index: `${this.EMPLOYEE_INDEX},${this.CLASS_INDEX}`,
      from: min,
      size: max - min,
      body: {
        sort: [
          '_score',
          { 'class.classId.keyword': { order: 'asc', unmapped_type: 'keyword' } }, // Use lower classId has tiebreaker after relevance
        ],
        query: {
          bool: {
            must: {
              multi_match: {
                query: query,
                type: 'most_fields', // More fields match => higher score
                fuzziness: 'AUTO',
                fields: fields,
              },
            },
            filter: {
              bool: {
                should: [
                  { term: { 'class.termId': termId } },
                  { term: { type: 'employee' } },
                ],
              },
            },
          },
        },
      },
    });

    this.getSubjectsFromClasses();

    return {
      searchContent: searchOutput.body.hits.hits.map((hit) => { return { ...hit._source, score: hit._score }; }),
      resultCount: searchOutput.body.hits.total.value,
      took: searchOutput.body.took,
    };
  }
}

const instance = new Elastic();
export default instance;
