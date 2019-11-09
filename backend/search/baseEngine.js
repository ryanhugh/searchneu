import elastic from '../elastic';
import searchEngine from './searchEngine';

class BaseEngine {
  constructor() {}

  async rightEngine(query) {
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

    const suggester = {
      phrase: {
        field: 'class.name.suggestions',
        confidence: 1.0,
        collate: {
          query: {
            source: {
              match: {
                '{{field_name}}': '{{suggestion}}',
              },
            },
          },
          params: { field_name: 'class.name' },
          prune: true,
        },
        direct_generator: [
          {
            field: 'class.name.suggestions',
            prefix_length: 2,
          },
        ],
      },
    };

    const searchResults = await elastic.search(query, termId, min, max, searchFields);
    const suggestion = this.suggestString(await elastic.suggest(query, suggester));

    return {
      ...results,
      suggestion: suggestion
    };
  }

  async suggestString(suggestResults) {
    // how do you deal with out-of-bounds errors?
    return suggestResults.body.suggest.valSuggest.options[0];
  }
}

const instance = new BaseEngine();
export default instance;
