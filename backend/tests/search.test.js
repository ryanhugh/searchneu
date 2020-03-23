import searcher from '../searcher';

beforeAll(async () => {
  await searcher.initializeSubjects();
})

describe('searcher', () => {
  describe('makeFilters', () => {
  });

  describe('formFilters', () => {
  });

  describe('generateQuery', () => {
    it('generates with no filters', () => {
      expect(searcher.generateMQuery('fundies', '202030', 0, 10, {})).toMatchSnapshot();
    });

    it('generates aggs with online filters applied', () => {
      expect(searcher.generateMQuery('fundies', '202030', 0, 10, { online: true })).toMatchSnapshot();
    });
  });

  // TODO: create an association between cols in elasticCourseSerializer and here
  describe('generateQuery', () => {
    it('generates a query without filters', () => {
      expect(searcher.generateQuery('fundies', [], 0, 10, 'nupath')).toEqual({
        sort: ['_score', {
          'class.classId.keyword': { order: 'asc', unmapped_type: 'keyword' },
        }],
        from: 0,
        size: 10,
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
                  'employee.phone',
                ],
              },
            },
            filter: {
              bool: {
                should: [
                  {
                    bool: {
                      must: [],
                    },
                  },
                  {
                    // why do we need this?
                    term: { type: 'employee' },
                  },
                ],
              },
            },
          },
        },
        aggregations: {
          nupath: {
            terms: { field: 'class.classAttributes.keyword' },
          },
        },
      });
    });
  });
});
