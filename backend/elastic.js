/* eslint-disable no-underscore-dangle */
/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import { Client } from '@elastic/elasticsearch';

const client = new Client({ node: 'http://localhost:9200' });
export const CLASS_INDEX = 'classes';
export const EMPLOYEE_INDEX = 'employees';

class Elastic {
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
    const bulk = [];
    for (const id of Object.keys(map)) {
      bulk.push({ index: { _id: id } });
      bulk.push(map[id]);
    }
    await client.bulk({ index: indexName, body: bulk });
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
      result[doc._id] = doc._source;
      return result;
    }, {});
  }

  /**
   * Search for classes and employees
   * @param  {string}  query  The search to query for
   * @param  {string}  termId The termId to look within
   * @param  {integer} min    The index of first document to retreive
   * @param  {integer} max    The index of last document to retreive
   */
  async search(query, termId, min, max) {
    const searchOutput = await client.search({
      index: `${EMPLOYEE_INDEX},${CLASS_INDEX}`,
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
                fields: [
                  'class.name^2', // Boost by 2
                  'class.name.autocomplete',
                  'class.subject^3',
                  'class.classId^2',
                  'sections.meetings.profs',
                  'class.crns',
                  'employee.name^2',
                  'employee.emails',
                  'employee.phone',
                ],
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
    return {
      searchContent: searchOutput.body.hits.hits.map((hit) => { return { ...hit._source, score: hit._score }; }),
      resultCount: searchOutput.body.hits.total.value,
      took: searchOutput.body.took,
    };
  }
}

const instance = new Elastic();
export default instance;
