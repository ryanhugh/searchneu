// import macros from '../backend/macros';

module.exports = {
  dev: {
    username: null,
    password: null,
    database: 'searchneu_dev',
    host: '127.0.0.1',
    dialect: 'postgres',
  },
  test: {
    username: null,
    password: null,
    database: 'searchneu_test',
    host: '127.0.0.1',
    dialect: 'postgres',
  },
  production: {
    username: null, // macros.getEnvVariable('DB_USERNAME'),
    password: null, // macros.getEnvVariable('DB_PASSWORD'),
    database: 'searchneu_prod', // macros.getEnvVariable('DB_NAME'),
    host: '127.0.0.1', // macros.getEnvVariable('DB_HOST'),
    dialect: 'postgres',
  },
};
