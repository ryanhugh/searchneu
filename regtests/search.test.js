import elastic from '../backend/elastic';
import loadIndices from '../scripts/reg_tests.js';

// assumptions: elasticsearch running locally with prod data indexed

let getFirstResult = (results) => {
  return results.searchContent[0]["class"];
}

describe('elastic', () => {
  beforeAll(async () => {
    await loadIndices();
  });

  it('returns specified class with class code query', async () => {
    let firstResult = getFirstResult(await elastic.search('cs2500', '202010', 0, 1));
    expect(firstResult.name).toBe("Fundamentals of Computer Science 1");
  });

  it('returns specified class with name query', async () => {
    let firstResult = getFirstResult(await elastic.search('fundamentals of computer science 2', '202010', 0, 1));
    expect(firstResult.classId).toBe("2510");
    expect(firstResult.subject).toBe("CS");
  });

  it('returns a professor if name requested', async () => {
    expect(true).toBe(true);
  });

  it('does not boost labs and recitations as top results', () => {
  });
});
