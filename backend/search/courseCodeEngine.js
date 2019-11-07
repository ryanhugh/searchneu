import elastic from '../elastic';
import SearchEngine from './searchEngine';

class CourseCodeEngine {
  constructor() {}

  // one plan would be to just test for course code pattern,
  // and if you have it, find the first 2-4 chars here,
  // and test it against the list, making the decision at that point
  function search(query, subject, termId, min, max) {
    const suggestField = SearchEngine.subjects.has(subject.toLowerCase()) ? 'class.classId' : 'class.subject';

    // after the first result, all of the following results should be of the same subject, e.g. it's weird to get ENGL2500 as the second or third result for CS2500
    const searchFields = ['class.subject^10', 'class.classId'];
    const suggester = {
      term: {
        field: suggestField,
        min_word_length: 2,
      },
    };

    const searchResults = elastic.search(query, termId, min, max, searchFields);
    const suggestion = this.suggestString(elastic.suggest(suggester));

    return {
      ...results,
      suggestion: suggestion
    };
  }

  // maybe you should name your suggester every time?
  function suggestString(suggestResults) {
    return suggestResults.body.suggest.valSuggest.map(result => {
      result.options ? result.options[0] : result.text
    }).join('');
  }
}
