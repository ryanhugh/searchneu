import searcher from '../searcher';

beforeAll(async () => {
  searcher.subjects = [];
})

describe('searcher', () => {
  describe('makeFilters', () => {
  });

  describe('formFilters', () => {
  });

  describe('generateMQuery', () => {
    it('generates with no filters', () => {
      expect(searcher.generateMQuery('fundies', '202030', 0, 10, {})).toMatchSnapshot();
    });

    it('generates aggs with online filters applied', () => {
      expect(searcher.generateMQuery('fundies', '202030', 0, 10, { online: true })).toMatchSnapshot();
    });
  });

  // TODO: create an association between cols in elasticCourseSerializer and here
  describe('generateQuery', () => {
    it('generates match_all when no query', () => {
      expect(searcher.generateQuery('', '202030', [], 0, 10).query.bool.must).toEqual({ match_all:{} });
    });

    it('generates a query without filters', () => {
      expect(searcher.generateQuery('fundies', '202030', [], 0, 10, 'nupath')).toMatchSnapshot();
    });
  });
});
