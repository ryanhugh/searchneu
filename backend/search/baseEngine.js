import elastic from '../elastic';
import searchEngine from './searchEngine';

class BaseEngine {
  constructor() {}

  rightEngine(query) {
    return true;
  }

  async search(query, termId, min, max) {
    const searchFields = [
      'class.name^2', // Boost by 2
      'class.name.autocomplete',
      'class.subject^4',
      'class.classId^3',
      'sections.meetings.profs',
      'class.crns',
      'employee.name^2',
      'employee.emails',
      'employee.phone',
    ];

    const searchResults = await elastic.search(query, termId, min, max, searchFields);
    const suggestion = this.suggestString(await elastic.phraseSuggest(query, 'class.name'));

    return {
      ...searchResults,
      suggestion: suggestion
    };
  }

  suggestString(suggestResults) {
    return (suggestResults[0] && suggestResults[0].options.length > 0 ? suggestResults[0].options[0].text : "");
  }
}

const instance = new BaseEngine();
export default instance;
