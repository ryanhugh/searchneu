import elastic from '../elastic';
import CourseCodeEngine from './courseCodeEngine';
import BaseEngine from './baseEngine';

// maybe store/export them here as a global variable?
class SearchEngine {
  constructor() {
    this.subjects = elastic.getSubjectsFromClasses();
    this.courseCodePattern = /^\s*([a-zA-Z]{2,4}\s*(\d{4})?\s*$/i;
  }

  static search(query, termId, min, max) {
    const patternResults = query.match(this.courseCodePattern);
    const validSubject = patternResults ? this.subjects.has(patternResults[1].toLowerCase()) : null;

    if (patternResults) {
      const engine = CourseCodeEngine();
      engine.search(query, subject, termId, min, max);
    } else {
      const engine = BaseEngine();
      engine.search(query, termId, min, max);
    }
  }
}
