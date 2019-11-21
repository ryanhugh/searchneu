import macros from '../backend/macros';

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
  prod: {
    username: macros.getEnvVariable('dbUsername'),
    password: macros.getEnvVariable('dbPassword'),
    database: macros.getEnvVariable('dbName'),
    host: macros.getEnvVariable('dbHost'),
    dialect: 'postgres',
  },
};
