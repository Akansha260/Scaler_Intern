const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Import and use routes
const boardRoutes = require('./routes/boards');
const listRoutes = require('./routes/lists');
const cardRoutes = require('./routes/cards');

app.use('/api/boards', boardRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/cards', cardRoutes);

// Start server only after DB connection
pool.connect()
  .then(() => {
    console.log("PostgreSQL connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  })
  .catch(err => {
    console.error("Database connection failed:", err);
    process.exit(1);
  });
