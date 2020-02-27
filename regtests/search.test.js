import elastic from '../backend/elastic';
import Keys from '../common/Keys';
import macros from '../backend/macros';

function getFirstClassResult(results) {
  return results.searchContent[0].class;
}

function getAllClassResult(results) {
  return results.searchContent;
}

describe('elastic', () => {
  it('returns specified class with class code query', async () => {
    const firstResult = getFirstClassResult(await elastic.search('cs2500', '202010', 0, 1));
    expect(Keys.getClassHash(firstResult)).toBe('neu.edu/202010/CS/2500');
  });

  it('returns specified class with name query', async () => {
    const firstResult = getFirstClassResult(await elastic.search('fundamentals of computer science 2', '202010', 0, 1));
    expect(Keys.getClassHash(firstResult)).toBe('neu.edu/202010/CS/2510');
  });

  it('returns a professor if name requested', async () => {
    const results = await elastic.search('mislove', '202010', 0, 1);
    const firstResult = results.searchContent[0].employee;
    expect(firstResult.emails).toContain('a.mislove@northeastern.edu');
  });

  it('returns a professor if email requested', async () => {
    const results = await elastic.search('a.mislove@northeastern.edu', '202010', 0, 1);
    const firstResult = results.searchContent[0].employee;
    expect(firstResult.emails).toContain('a.mislove@northeastern.edu');
  });

  it('returns a professor if phone requested', async () => {
    const results = await elastic.search('6173737069', '202010', 0, 1);
    const firstResult = results.searchContent[0].employee;
    expect(firstResult.emails).toContain('a.mislove@northeastern.edu');
  });

  it('does not place labs and recitations as top results', async () => {
    const firstResult = getFirstClassResult(await elastic.search('cs', '202010', 0, 1));
    expect(['Lab', 'Recitation & Discussion', 'Seminar']).not.toContain(firstResult.scheduleType);
  });

  it('aliases class names', async () => {
    const firstResult = getFirstClassResult(await elastic.search('fundies', '202010', 0, 1));
    expect(Keys.getClassHash(firstResult)).toBe('neu.edu/202010/CS/2500');
  });

  [['cs', '2500'], ['cs', '2501'], ['thtr', '1000']].forEach((item) => {
    it(`always analyzes course code  ${item.join(' ')} the same way regardless of string`, async () => {
      const canonicalResult = getFirstClassResult(await elastic.search(item.join(' '), '202010', 0, 1));

      const firstResult = getFirstClassResult(await elastic.search(item.join(''), '202010', 0, 1));
      expect(Keys.getClassHash(firstResult)).toBe(Keys.getClassHash(canonicalResult));

      const secondResult = getFirstClassResult(await elastic.search(item.join(' ').toUpperCase(), '202010', 0, 1));
      expect(Keys.getClassHash(secondResult)).toBe(Keys.getClassHash(canonicalResult));

      const thirdResult = getFirstClassResult(await elastic.search(item.join('').toUpperCase(), '202010', 0, 1));
      expect(Keys.getClassHash(thirdResult)).toBe(Keys.getClassHash(canonicalResult));
    });
  });

  it('returns search results of same subject if course code query', async () => {
    const results = await elastic.search('cs2500', '202010', 0, 10);
    results.searchContent.map((result) => { return expect(result.class.subject).toBe('CS'); });
  });

  it('autocorrects typos', async () => {
    const firstResult = getFirstClassResult(await elastic.search('fundimentals of compiter science', '202010', 0, 1));
    expect(Keys.getClassHash(firstResult)).toBe('neu.edu/202010/CS/2500');
  });

  it('does not return default results', async () => {
    const results = await elastic.search('', '202010', 0, 10);
    expect(results.searchContent.length).toBe(0);
  });

  it('fetches correct result if query is a crn', async () => {
    const firstResult = getFirstClassResult(await elastic.search('10460', '202010', 0, 1));
    expect(Keys.getClassHash(firstResult)).toBe('neu.edu/202010/CS/2500');
  });

  it('filter by one college', async () => {
    const allResults = getAllClassResult(await elastic.search('course', '202010', 0, 100, { college: ['Computer&Info Sci'] }));
    allResults.forEach(result => expect(result.class.classAttributes).toContain('Computer&Info Sci'));
  });

  it('filter by multiple colleges', async () => {
    const allResults = getAllClassResult(await elastic.search('course', '202010', 0, 100, { college: ['Computer&Info Sci'] }));
    allResults.forEach(result => expect(result.class.classAttributes).toContain('Computer&Info Sci'));
  });
});
