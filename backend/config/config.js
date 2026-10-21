// Sequelize CLI settings (migrations and seeders). Values come only from the
// environment (backend/.env) so no database password lives in the code, and
// development/test can never point at production by accident.
require('dotenv').config();

const fromEnv = (prefix = '') => ({
  username: process.env[`${prefix}DB_USER`],
  password: process.env[`${prefix}DB_PASSWORD`],
  database: process.env[`${prefix}DB_NAME`],
  host: process.env[`${prefix}DB_HOST`] || '127.0.0.1',
  port: Number(process.env[`${prefix}DB_PORT`]) || 3306,
  dialect: 'mysql',
  logging: false,
});

module.exports = {
  development: fromEnv(),
  test: fromEnv('TEST_'),
  production: fromEnv(),
};
