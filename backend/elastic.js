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

  /**
   * Get all occurrences of a class
   * @param {string} host     Host to search in
   * @param {string} subject  Subject (department) to search in
   * @param {integer} classId Class ID code to find
   */
  async getAllClassOccurrences(host, subject, classId) {
    const got = await client.search({
      index: this.CLASS_INDEX,
      body: {
        size: 10,
        query: {
          bool: {
            filter: [
              { term: { 'class.host.keyword': host } },
              { term: { 'class.subject.keyword': subject } },
              { term: { 'class.classId.keyword': classId } },
            ],
          },
        },
      },
    });
    const hits = got.body.hits.hits.map((c) => { return c._source.class; });
    return hits;
  }

  /**
   * Get the latest occurrence of a class
   * @param {string} host     Host to search in
   * @param {string} subject  Subject (department) to search in
   * @param {integer} classId Class ID code to find
   */
  async getLatestClassOccurrence(host, subject, classId) {
    const got = await client.search({
      index: this.CLASS_INDEX,
      body: {
        sort: { 'class.termId.keyword' : 'desc' },
        size: 1,
        query: {
          bool: {
            filter: [
              { term: { 'class.host.keyword': host } },
              { term: { 'class.subject.keyword': subject } },
              { term: { 'class.classId.keyword': classId } },
            ],
          },
        },
      },
    });
    const hit = got.body.hits.hits[0];
    return hit ? hit._source.class : null;
  }

  /*
   * Get all subjects for classes in the index
   */
  async getSubjectsFromClasses() {
    const subjects = await client.search({
      index: `${this.CLASS_INDEX}`,
      body: {
        aggs: {
          subjects: {
            global: {},
            aggs: {
              subjects: {
                terms: {
                  field: 'class.subject.keyword',
                  size: 10000, // anything that will get everything
                },
              },
            },
          },
        },
      },
    });
    return _.map(subjects.body.aggregations.subjects.subjects.buckets, (subject) => { return subject.key.toLowerCase(); });
  }

  /**
   * Get elasticsearch query from json filters and termId
   * @param  {string}  termId  The termId to look within
   * @param  {object}  filters The json object representing all filters
   */
  getClassFilterQuery(termId, filters) {
    // filter classes to get those with sections
    const hasSections = { exists: { field: 'sections' } };

    // filter by term
    const filterByTermId = { term: { 'class.termId': termId } };

    const getNUpathFilter = (selectedNUpaths) => {
      const NUpathFilters = selectedNUpaths.map(eachNUpath => ({ match_phrase: { 'class.classAttributes': eachNUpath } }));
      return { bool: { should: NUpathFilters } };
    };

    const getCollegeFilter = (selectedColleges) => {
      const collegeFilters = selectedColleges.map(eachCollege => ({ match_phrase: { 'class.classAttributes': eachCollege } }));
      return { bool: { should: collegeFilters } };
    };

    const getSubjectFilter = (selectedSubject) => {
      const subjectFilters = selectedSubject.map(eachSubject => ({ match: { 'class.subject': eachSubject } }));
      return { bool: { should: subjectFilters } };
    };

    // note that { online: false } should not never be in filters
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

    const classFilters = [hasSections, filterByTermId];
    for (const [filterKey, filterValues] of Object.entries(filters)) {
      if (filterKey in filterToEsQuery) {
        classFilters.push(filterToEsQuery[filterKey](filterValues));
      }
    }

    return classFilters;
  }

  /**
   * Search for classes and employees
   * @param  {string}  query   The search to query for
   * @param  {string}  termId  The termId to look within
   * @param  {integer} min     The index of first document to retreive
   * @param  {integer} max     The index of last document to retreive
   * @param  {object}  filters The json object representing all filters
   */
  async search(query, termId, min, max, filters = {}) {
    if (!this.subjects) {
      this.subjects = new Set(await this.getSubjectsFromClasses());
    }

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
    if (patternResults && this.subjects.has(patternResults[1].toLowerCase())) {
      // after the first result, all of the following results should be of the same subject, e.g. it's weird to get ENGL2500 as the second or third result for CS2500
      fields = ['class.subject^10', 'class.classId'];
    }

    // get compound class filters
    const classFilters = this.getClassFilterQuery(termId, filters);

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

    if (filters) {
      /* we want the following filters to modify the default es query
      - NUpath
      - college
      - subject (= major)
      - online
      - sectionsAvailable
      - classType
      */
    }

    // filter by NUpath
    let filterByNUpath = null;
    if ('NUpath' in filters) {
      filterByNUpath = {
        filter: {
          terms: {
            'class.classAttributes' : filters.college,
          },
        },
      };
    }

    // filter by college
    let filterByCollege = null;
    if ('college' in filters) {
      filterByCollege = {
        filter: {
          terms: {
            'class.classAttributes' : filters.college,
          },
        },
      };
    }

    // filter by subject
    let filterBySubject = null;
    if ('subject' in filters) {
      filterBySubject = {
        filter: {
          terms: {
            'class.subject' : ['CS'], // TODO change this to filters value
          },
        },
        random_score: {},
        weight: 23,
      };
    }

    // filter by online
    let onlineFilter = null;
    if ('online' in filters && filters.online) {
      onlineFilter = {
        filter: {
          match: {
            'sections.online': true,
          },
        },
        weight: 5,
      };
    }

    // filter by sectionAvailable
    let sectionAvailableFilter = null;
    if ('sectionAvailable' in filters && filters.sectionAvailable) {
      sectionAvailableFilter = {
        filter: {
          match: {
            'sections.online': true,
          },
        },
        random_score: {},
        weight: 23,
      };
    }

    // filter by class type
    let classTypeFilter = null;
    if ('classType' in filters) {
      classTypeFilter = {
        filter: {
          match: {
            'class.scheduleType': filters.classType,
          },
        },
        random_score: {},
        weight: 23,
      };
    }

    // remove null filters
    const allValidFilters = [
      // filterByNUpath,
      // filterByCollege,
      // filterBySubject,
      onlineFilter,
      // sectionAvailableFilter,
      // classTypeFilter,
    ].filter(eachFilter => eachFilter != null);

    // text query from the main search box
    const searchBoxQuery = {
      bool: {
        must: [
          {
            multi_match: {
              query: query,
              type: 'most_fields', // More fields match => higher score
              fuzziness: 'AUTO',
              fields: fields,
            },
          },
        ],
        filter: {
          bool: {
            should: [
              { term: { 'class.termId': termId } },
              { term: { type: 'employee' } },
            ],
          },
        },
      },
    };

    // ensure result pass at least one filter when filters exist
    const minScore = allValidFilters.length > 0 ? 100 : 5;

    // compound query for text query and filters
    const esQuery = {
      index: `${this.EMPLOYEE_INDEX},${this.CLASS_INDEX}`,
      // from: min,
      // size: max - min,
      body: {
        sort: ['_score', sortByClassId],
        query: {
          function_score: { // Use function_score to only filter on class with matching query
            query: searchBoxQuery,
            // boost: 5,
            functions: allValidFilters,
            // max_boost: 100,
            score_mode: 'max',
            boost_mode: 'sum',
            min_score: minScore,
          },
        },
      },
    };

    const prevQuery = {
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
                  {
                    bool: {
                      must: [
                        { exists: { field: 'sections' } },
                        { term: { 'class.termId': termId } },
                        { term: { 'sections.online': true } },
                        {
                          bool: {
                            should: [
                              { match_phrase: { 'class.classAttributes': 'GS College of Science' } },
                              { match_phrase: { 'class.classAttributes': 'Computer&Info Sci' } },
                            ],
                          },
                        },
                      ],
                    },
                  },
                  { term: { type: 'employee' } },
                ],
              },
            },
          },
        },
      },
    };

    macros.log(JSON.stringify(prevQuery));
    const searchOutput = await client.search(prevQuery);

    return {
      searchContent: searchOutput.body.hits.hits.map((hit) => { return { ...hit._source, score: hit._score }; }),
      resultCount: searchOutput.body.hits.total.value,
      took: searchOutput.body.took,
    };
  }
}

const instance = new Elastic();
export default instance;

/*
curl -X GET "localhost:9200/classes/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "bool": {
      "must": {
        "multi_match": {
          "query": "cs 2500",
          "type": "most_fields",
          "fuzziness": "AUTO",
          "fields": [
            "class.subject^10",
            "class.classId"
          ]
        }
      },
      "filter": {
        "bool": {
          "should": [
            {
              "bool": {
                "must": [
                  {
                    "exists": {
                      "field": "sections"
                    }
                  },
                  {
                    "term": {
                      "class.termId": "202010"
                    }
                  },
                  {
                    "term": {
                      "sections.online": true
                    }
                  }
                ]
              }
            },
            {
              "term": {
                "type": "employee"
              }
            }
          ]
        }
      }
    }
  }
}
'
 */
