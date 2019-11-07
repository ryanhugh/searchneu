import elastic from '../elastic';
import searchEngine from './searchEngine';

class baseEngine {
  constructor() {}

  function search(query, termId, min, max) {
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

    const searchResults = elastic.search(query, termId, min, max, searchFields);
    const suggestion = this.suggestString(elastic.suggest(suggester));

    return {
      ...results,
      suggestion: suggestion
    };
  }

  function suggestString(suggestResults) {
    // how do you deal with out-of-bounds errors?
    return suggestResults.body.suggest.valSuggest.options[0];
  }
}
