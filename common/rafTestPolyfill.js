
// Fix to hide this warning until jsdom adds support for requestAnimationFrame
// https://github.com/facebook/jest/issues/4545

// Polyfill window.localStorage and window.sessionStorage for unit tests. (JSDOM dosen't include them)
import 'mock-local-storage';

if (process.env.NODE_ENV === 'test') {
  global.requestAnimationFrame = (callback) => {
    setTimeout(callback, 0);
  };

  window.ga = function ga() {

  };
}
