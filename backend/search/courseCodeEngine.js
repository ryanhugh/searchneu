import elastic from '../elastic';
import SearchEngine from './searchEngine';

class CourseCodeEngine {
  constructor() {}

  // one plan would be to just test for course code pattern,
  // and if you have it, find the first 2-4 chars here,
  // and test it against the list, making the decision at that point
  function search(query, subject, termId, min, max) {
    const suggestField = SearchEngine.subjects.has(subject.toLowerCase()) ? 'classId' : 'subject';

    const searchFields = ['class.subject^10', 'class.classId'];
    const suggester = {
      term: {
        field: 'class.classId',
        min_word_length: 2,
      },
    };

    const results = elastic.search(query, termId, min, max, searchFields);
    const suggestResults = elastic.suggest(suggester);

    return {
      **results,
      suggestion: this.suggestString(suggestResults);
    };
  }
}
