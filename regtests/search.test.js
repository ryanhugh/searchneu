import _ from 'lodash';
import elastic from '../backend/elastic';
import Keys from '../common/Keys';

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

  it('filter by one NUpath', async () => {
    const NUpath = 'NUpath Writing Intensive';
    const allResults = getAllClassResult(await elastic.search('2500', '202010', 0, 20, { NUpath: [NUpath] }));
    expect(allResults.length > 0).toBe(true);
    allResults.forEach(result => expect(result.class.classAttributes).toContain(NUpath));
  });

  it('filter by multiple NUpaths', async () => {
    const NUpaths = ['NUpath Difference/Diversity', 'NUpath Interpreting Culture'];
    const allResults = getAllClassResult(await elastic.search('2500', '202010', 0, 20, { college: NUpaths }));
    expect(allResults.length > 0).toBe(true);
    allResults.forEach(result => expect(_.intersection(result.class.classAttributes, NUpaths).length > 0).toBe(true));
  });

  it('filter by one college', async () => {
    const college = 'Computer&Info Sci';
    const allResults = getAllClassResult(await elastic.search('2500', '202010', 0, 20, { college: [college] }));
    expect(allResults.length > 0).toBe(true);
    allResults.forEach(result => expect(result.class.classAttributes).toContain(college));
  });

  it('filter by multiple colleges', async () => {
    const colleges = ['GS College of Science', 'GSBV Bouve'];
    const allResults = getAllClassResult(await elastic.search('2500', '202010', 0, 20, { college: colleges }));
    expect(allResults.length > 0).toBe(true);
    allResults.forEach(result => expect(_.intersection(result.class.classAttributes, colleges).length > 0).toBe(true));
  });

  it('filter by one subject', async () => {
    const subject = 'CS';
    const allResults = getAllClassResult(await elastic.search('2500', '202010', 0, 20, { subject: [subject] }));
    expect(allResults.length > 0).toBe(true);
    allResults.forEach(result => expect(result.class.subject).toBe(subject));
  });

  it('filter by multiple subjects', async () => {
    const subjects = ['CS', 'ENGL'];
    const allResults = getAllClassResult(await elastic.search('2500', '202010', 0, 20, { subject: subjects }));
    expect(allResults.length > 0).toBe(true);
    allResults.forEach(result => expect(subjects).toContain(result.class.subject));
  });

  it('filter for online: if any section is online', async () => {
    const onlineFilter = { online: true };
    const allResults = getAllClassResult(await elastic.search('2500', '202010', 0, 20, onlineFilter));
    expect(allResults.length > 0).toBe(true);
    allResults.forEach(result => expect(result.sections.map(section => section.online)).toContain(true));
  });

  it('filter for online: online option not selected', async () => {
    const onlineFilter = { online: false };
    const allResults = getAllClassResult(await elastic.search('2500', '202010', 0, 20, onlineFilter));
    expect(allResults.length > 0).toBe(true);
  });

  it('filter for class type of seminar', async () => {
    const classTypeFilter = { classType: 'Seminar' };
    const allResults = getAllClassResult(await elastic.search('2500', '202010', 0, 20, classTypeFilter));
    expect(allResults.length > 0).toBe(true);
    allResults.forEach(result => expect(result.class.scheduleType).toBe(classTypeFilter.classType));
  });

  it('filter for class type of lab', async () => {
    const classTypeFilter = { classType: 'Lab' };
    const allResults = getAllClassResult(await elastic.search('2500', '202010', 0, 20, classTypeFilter));
    expect(allResults.length > 0).toBe(true);
    allResults.forEach(result => expect(result.class.scheduleType).toBe(classTypeFilter.classType));
  });

  it('filter for one NUpath, college, subject, online, classType', async () => {
    const filters = {
      NUpath: ['NU Core/NUpath Adv Writ Dscpl'],
      college: ['UG Col Socl Sci & Humanities'],
      subject: ['ENGW'],
      online: true,
      classType: 'Lecture',
    };
    const allResults = getAllClassResult(await elastic.search('writing', '202010', 0, 5, filters));
    expect(allResults.length > 0).toBe(true);
    allResults.forEach(result => expect(result.class.classAttributes).toContain(filters.NUpath[0]));
    allResults.forEach(result => expect(result.class.classAttributes).toContain(filters.college[0]));
    allResults.forEach(result => expect(result.class.subject).toBe(filters.subject[0]));
    allResults.forEach(result => expect(result.sections.map(section => section.online)).toContain(true));
    allResults.forEach(result => expect(result.class.scheduleType).toBe(filters.classType));
  });

  it('filter for multiple NUpath, college, subject, online, classType', async () => {
    const filters = {
      NUpath: ['NU Core/NUpath Adv Writ Dscpl', 'NUpath Interpreting Culture'],
      college: ['UG Col Socl Sci & Humanities', 'GS Col of Arts', 'Computer&Info Sci'],
      subject: ['ENGW', 'ARTG', 'CS'],
      online: true,
      classType: 'Lecture',
    };
    const allResults = getAllClassResult(await elastic.search('science', '202010', 0, 2, filters));
    expect(allResults.length > 0).toBe(true);
    allResults.forEach(result => expect(_.intersection(result.class.classAttributes, filters.NUpath).length > 0).toBe(true));
    allResults.forEach(result => expect(_.intersection(result.class.classAttributes, filters.college).length > 0).toBe(true));
    allResults.forEach(result => expect(filters.subject).toContain(result.class.subject));
    allResults.forEach(result => expect(result.sections.map(section => section.online)).toContain(true));
    allResults.forEach(result => expect(result.class.scheduleType).toBe(filters.classType));
  });
});
