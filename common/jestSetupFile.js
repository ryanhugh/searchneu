
// Fix to hide this warning until jsdom adds support for requestAnimationFrame
// https://github.com/facebook/jest/issues/4545

// Polyfill window.localStorage and window.sessionStorage for unit tests. (JSDOM dosen't include them)
import 'mock-local-storage';
import 'regenerator-runtime/runtime';


if (process.env.NODE_ENV === 'test') {
  global.requestAnimationFrame = (callback) => {
    setTimeout(() => callback(), 0);
  };

  window.ga = function ga() {

  };
}

// Mock out this file on all tests/
// This file is a data-abstraction-layer (aka wrapper) around window.FB, which does not exist in TEST
jest.mock('../frontend/components/facebook');
