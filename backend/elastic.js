/* eslint-disable no-underscore-dangle */
/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import { Client } from '@elastic/elasticsearch';
import _ from 'lodash';
import pMap from 'p-map';
import macros from './macros';

const URL = macros.getEnvVariable('elasticURL') || 'http://localhost:9200';
const client = new Client({ node: URL });

const BULKSIZE = 5000;

class Elastic {
  constructor() {
    // Because we export an instance of this class, put the constants on the instance.
    this.CLASS_INDEX = 'classes';
    this.EMPLOYEE_INDEX = 'employees';
    // keep internal track of the available subjects
    this.subjects = null;
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
   * Ensures that an index exists. Creates it (with the given mapping) if it doesn't exist.
   * @param  {string} indexName The index to insert into
   * @param  {Object} mapping   The new elasticsearch index mapping(schema)
   */
  async ensureIndexExists(indexName, mapping) {
    const results = await client.indices.exists({ index: indexName });

    // If the index doesn't exist, create it.
    if (results.statusCode !== 200) {
      await client.indices.create({
        index: indexName,
        body: mapping,
      });
    }
  }

  /**
   * Inserts a singular doc into an index.
   * @param  {string} indexName The index to insert into
   * @param  {Object} doc   The new doc to insert into the index.
   * TODO: I guess this is necessary? same as below
   */
  insertDoc(indexName, doc) {
    return client.index({
      index: indexName,
      body: doc,
    });
  }

  /**
   * Bulk index a collection of documents using ids from hashmap
   * @param  {string} indexName The index to insert into
   * @param  {Object} map       A map of document ids to document sources to create
   * TODO: same as below?
   */
  async bulkIndexFromMap(indexName, map) {
    const chunks = _.chunk(Object.keys(map), BULKSIZE);
    return pMap(chunks, (chunk, chunkNum) => {
      macros.log(`indexed ${chunkNum * BULKSIZE} docs into ${indexName}`);
      const bulk = [];
      for (const id of chunk) {
        bulk.push({ index: { _id: id } });
        bulk.push(map[id]);
      }
      return client.bulk({ index: indexName, refresh: 'wait_for', body: bulk });
    },
    { concurrency: 1 });
  }

  /**
   * Bulk update a collection of documents using ids fromhashmap
   * @param  {string} indexName The index to update into
   * @param  {Object} map       A map of document ids to document sources to update
   * TODO: does this need the Elastic serializer? why does this exist?
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
   * Get a hashmap of ids to documents from a list of ids
   * @param  {string} indexName Index to get from
   * @param  {Array}  ids       Array of string ids to get
   * @return {Object} The map between doc ids and doc source
   * TODO: replace with Postgres?
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

  async query(index, from, size, body) {
    return client.search({
      index: index, from: from, size: size, body: body,
    });
  }

  async mquery(index, queries) {
    const multiQuery = [];
    for (const query of queries) {
      multiQuery.push({ index });
      multiQuery.push(query);
    }
    return client.msearch({ body: multiQuery });
  }
}

const instance = new Elastic();
export default instance;
