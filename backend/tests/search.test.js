import searcher from '../searcher';

describe('searcher', () => {
  describe('makeFilters', () => {
  });

  describe('formFilters', () => {
  });

  // TODO: create an association between cols in elasticCourseSerializer and here
  describe('generateQuery', () => {
    it('generates a query without filters', () => { expect(searcher.generateQuery('fundies', '202010', {})).toEqual({ sort: ['_score', {
          'class.classId.keyword': { order: 'asc', unmapped_type: 'keyword' }
        }],
        query: {
          bool: {
            must: {
              multi_match: {
                query: 'fundies',
                type: 'most_fields',
                fuzziness: 'AUTO',
                fields: [
                  'class.name^2',
                  'class.name.autocomplete',
                  'class.subject^4',
                  'class.classId^3',
                  'sections.profs',
                  'class.crns',
                  'employee.name^2',
                  'employee.emails',
                  'employee.phone'
                ],
              }
            },
            filter: {
              bool: {
                should: [
                  {
                    bool: {
                      must: [
                        {
                          // does this filter actually work?
                          exists: { field: 'sections' }
                        },
                        {
                          term: { 'class.termId': '202010' }
                        }
                      ]
                    }
                  },
                  {
                    // why do we need this?
                    term: { type: 'employee' }
                  }
                ]
              }
            }
          }
        },
        aggregations: {
          sectionsAvailable: {
            filter: { exists: { field: 'sections' } }
          }
        }
      });
    });
  });
});
