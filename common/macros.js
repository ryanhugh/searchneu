
// Setup environmental constants. This is used in both the frontend and the backend. The process.env is set in webpack and in package.jsonp
// These are setup in the webpack config


class Macros {

}


if (process.env.PROD || process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'prod') {
  Macros.DEV = true;
  console.log('Running in prod mode.');
} else if (process.env.DEV || process.env.NODE_ENV === 'dev') {
  Macros.DEV = true;
  console.log('Running in dev mode.');
} else if (process.env.NODE_ENV === 'test') {
  Macros.TESTS = true;
} else {
  console.log(`Unknown env! (${process.env.NODE_ENV}) Setting to dev.`);
  Macros.DEV = true;
}

if (!Macros.PROD) {
  Macros.PROD = false;
}

if (!Macros.DEV) {
  Macros.DEV = false;
}

if (!Macros.TESTS) {
  Macros.TESTS = false;
}

export default Macros;
