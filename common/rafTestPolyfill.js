
// Fix to hide this warning until jsdom adds support for requestAnimationFrame
// https://github.com/facebook/jest/issues/4545
if (process.env.NODE_ENV === 'test') {
  global.requestAnimationFrame = (callback) => {
    setTimeout(callback, 0);
  };
}
