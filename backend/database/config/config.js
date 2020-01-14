const fs = require('fs');

require('dotenv').config();
const dbCert = process.env.dbCertPath ? fs.readFileSync(process.env.dbCertPath) : "";

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
    username: process.env.dbUsername,
    password: process.env.dbPassword,
    database: process.env.dbName,
    host: process.env.dbHost,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        rejectUnauthorized: true,
        ca: dbCert,
      },
    },
  },
};
