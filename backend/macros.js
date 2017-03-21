
let config;
if (process.env.NODE_ENV !== 'prod') {
  config = {
    port: 5000,
    DEV: true,
    PROD: false,
  };
} else {
  config = {
    port: 80,
    DEV: false,
    PROD: true,
  };
}


export default config;
