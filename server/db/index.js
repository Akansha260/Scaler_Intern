const { Pool } = require('pg');

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      }
    : {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'trello_clone',
        password: process.env.DB_PASSWORD || 'postgres',
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
      }
);

// Log when a new connection is established
pool.on('connect', () => {
  console.log('PostgreSQL client connected to pool');
});

// Catch unexpected database errors
pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error', err);
  process.exit(1);
});

module.exports = pool;