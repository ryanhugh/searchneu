import elastic from '../backend/elastic';
import Keys from '../common/Keys';

// assumptions: elasticsearch running locally with prod data indexed

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
    expect(firstResult.name).toBe('Alan Mislove');
  });

  it('does not place labs and recitations as top results', async () => {
    let firstResult = getFirstClassResult(await elastic.search('cs', '202010', 0, 1));
    expect(['Lab', 'Recitation & Discussion', 'Seminar']).not.toContain(firstResult.scheduleType);
  });

  it('aliases class names', async () => {
    let firstResult = getFirstClassResult(await elastic.search('fundies', '202010', 0, 1));
    expect(Keys.getClassHash(firstResult)).toBe('neu.edu/202010/CS/2500');
  });
});

// other tests I want:
// check two aliases, maybe more than that
// that's probably fine honestly
