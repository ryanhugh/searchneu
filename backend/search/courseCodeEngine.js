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
    const patternResults = query.match(this.courseCodePattern);

    const subjects = await elastic.getSubjectsFromClasses();
    const suggestField = subjects.has(patternResults[1].toLowerCase()) ? 'class.classId' : 'class.subject';

    // after the first result, all of the following results should be of the same subject, e.g. it's weird to get ENGL2500 as the second or third result for CS2500
    const searchFields = ['class.subject^10', 'class.classId'];
    const suggester = {
      term: {
        field: suggestField,
        min_word_length: 2,
      },
    };

    const searchResults = await elastic.search(query, termId, min, max, searchFields);
    const suggestion = this.suggestString(await elastic.suggest(query, suggester));

    const returnVal = {
      ...searchResults,
      suggestion: suggestion
    };

    return {
      ...searchResults,
      suggestion: suggestion
    };
  }

  // maybe you should name your suggester every time?
  suggestString(suggestResults) {
    return suggestResults.body.suggest.valSuggest.map((result) => {
      return (result.options.length !== 0 ? result.options[0].text : result.text);
    }).join('');
  }
}

const instance = new CourseCodeEngine();
export default instance;
