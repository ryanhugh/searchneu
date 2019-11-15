import macros from '../backend/macros';

module.exports = {
  development: {
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
    username: macros.getEnvVariable('DB_USERNAME'),
    password: macros.getEnvVariable('DB_PASSWORD'),
    database: macros.getEnvVariable('DB_NAME'),
    host: macros.getEnvVariable('DB_HOST'),
    dialect: 'postgres',
  },
};
