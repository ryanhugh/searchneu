import macros from './macros';

// Mock class returned in development mode or in testing when getRef is called.
// This is to make testing easier and to avoid using production quota in development.
class MockFirebaseRef {
  constructor(db, key) {
    this.db = db;
    this.key = key;
  }

  value(key) {
    if (key !== 'once') {
      macros.error('only once is supported');
      return null;
    }

    return this.db[this.key];
  }

  set(value) {
    if (!value) {
      macros.warn('Null value in MockFirebaseRef set?');
    }
    this.db[this.key] = value;
  }
}

export default MockFirebaseRef;
