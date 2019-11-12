import elastic from '../elastic';
import courseCodeEngine from './courseCodeEngine';
import baseEngine from './baseEngine';

class SearchEngine {
  constructor() {
    this.engines = [courseCodeEngine, baseEngine];
  }

  async search(query, termId, min, max) {
    console.log(query);
    console.log('the search begins');
    for (const engine of this.engines) {
      if (engine.rightEngine(query)) {
        return engine.search(query, termId, min, max);
      }
    }
  }
}

const instance = new SearchEngine();
export default instance;
