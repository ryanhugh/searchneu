/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import macros from './macros';

// Mock class returned in development mode or in testing when getRef is called.
// This is to make testing easier and to avoid using production quota in development.
class MockFirebaseRef {
  constructor(database, key) {
    this.database = database;
    this.key = key;
  }

  once(key) {
    if (key !== 'value') {
      macros.error('only value is supported');
      return null;
    }

    return {
      val: () => {
        return this.database.getMemoryStorage(this.key);
      },
    };
  }

  set(value) {
    if (!value) {
      macros.warn('Null value in MockFirebaseRef set?');
    }

    this.database.setMemoryStorage(this.key, value);
  }
}

export default MockFirebaseRef;
