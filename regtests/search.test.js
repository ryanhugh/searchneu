import elastic from '../backend/elastic';
import Keys from '../common/Keys';

function getFirstClassResult(results) {
  return results.searchContent[0]["class"];
}

describe('elastic', () => {
  it('returns specified class with class code query', async () => {
    let firstResult = getFirstClassResult(await elastic.search('cs2500', '202010', 0, 1));
    expect(Keys.getClassHash(firstResult)).toBe('neu.edu/202010/CS/2500');
  });

  it('returns specified class with name query', async () => {
    let firstResult = getFirstClassResult(await elastic.search('fundamentals of computer science 2', '202010', 0, 1));
    expect(Keys.getClassHash(firstResult)).toBe('neu.edu/202010/CS/2510');
  });

  it('returns a professor if name requested', async () => {
    let results = await elastic.search('mislove', '202010', 0, 1);
    let firstResult = results.searchContent[0]["employee"];
    expect(firstResult.emails).toContain('a.mislove@northeastern.edu');
  });

  it('does not place labs and recitations as top results', async () => {
    let firstResult = getFirstClassResult(await elastic.search('cs', '202010', 0, 1));
    expect(['Lab', 'Recitation & Discussion', 'Seminar']).not.toContain(firstResult.scheduleType);
  });

  it('aliases class names', async () => {
    let firstResult = getFirstClassResult(await elastic.search('fundies', '202010', 0, 1));
    expect(Keys.getClassHash(firstResult)).toBe('neu.edu/202010/CS/2500');
  });

  [['cs', '2500'], ['cs', '2501', 'thtr', '1000'].forEach((item, index, array) => {
    it(`always analyzes course code  ${item.join(' ')} the same way regardless of string`, async () => {
      let canonicalResult = getFirstClassResult(await elastic.search(item.join(' '), '202010', 0, 1));

      let firstResult = getFirstClassResult(await elastic.search(item.join(''), '202010', 0, 1));
      expect(Keys.getClassHash(firstResult)).toBe(Keys.getClassHash(canonicalResult));
 
      let secondResult = getFirstClassResult(await elastic.search(item.join(' ').toUpperCase(), '202010', 0, 1));
      expect(Keys.getClassHash(secondResult)).toBe(Keys.getClassHash(canonicalResult));

      let thirdResult = getFirstClassResult(await elastic.search(item.join('').toUpperCase(), '202010', 0, 1));
      expect(Keys.getClassHash(thirdResult)).toBe(Keys.getClassHash(canonicalResult));
    });
  });
});

/*
 * tests I need:
 * 1. test blank?
 * 2. test bogus?
 * 3. test typos?
 * 4. test that course codes work as expected, so:
 *    --> spaces don't change anything
 *    --> capitalization doesn't change anything
 *    --> all the following results are of the same subject type not the same classId
 * 5. typing in niche things like emails and whatnot always fetch the right thing
 */
