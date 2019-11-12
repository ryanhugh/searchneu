import elastic from '../elastic';

class CourseCodeEngine {
  constructor() {
    // if we know that the query is of the format of a course code, we want to do a very targeted query against subject and classId: otherwise, do a regular query.
    this.courseCodePattern = /^\s*([a-zA-Z]{2,4})\s*(\d{0,4})\s*$/i;
  }

  rightEngine(query) {
    return this.courseCodePattern.test(query);
  }

  async search(query, termId, min, max) {
    console.log('we enter the course code search here');
    const patternResults = query.match(this.courseCodePattern);

    const subjects = await elastic.getSubjectsFromClasses();
    const suggestField = subjects.has(patternResults[1].toLowerCase()) ? 'class.classId' : 'class.subject';

    // after the first result, all of the following results should be of the same subject, e.g. it's weird to get ENGL2500 as the second or third result for CS2500
    const searchFields = ['class.subject^10', 'class.classId'];

    const searchResults = await elastic.search(query, termId, min, max, searchFields);
    console.log('course code search made');
    const suggestion = this.suggestString(await elastic.termSuggest(query, suggestField));
    console.log('course code suggestion found');

    return {
      ...searchResults,
      suggestion: suggestion
    };
  }

  suggestString(suggestResults) {
    return suggestResults.map((result) => {
      return (result.options.length !== 0 ? result.options[0].text : result.text);
    }).join('');
  }
}

const instance = new CourseCodeEngine();
export default instance;
