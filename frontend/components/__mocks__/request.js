/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import macros from '../macros';

// This file mocks out request.js
// Provides stubs for all the methods.



class MockRequest {
  
  async get() {
    return {
      results: []
    }
  }



}


export default new MockRequest();
