const { Pool } = require('pg');

// Налаштування підключення до PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'smartcoffee_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

pool.on('connect', () => {
  console.log('⚡ Успішно підключено до бази даних PostgreSQL');
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};