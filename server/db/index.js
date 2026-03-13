const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://ak_project_user:yfpGa4jtlj46iqcjKLe6bwDFwSJ9nO9y@dpg-d6q3v47kijhs739pn97g-a.oregon-postgres.render.com/ak_project',
  ssl: { rejectUnauthorized: false }
});

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
