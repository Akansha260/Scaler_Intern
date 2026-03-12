const express = require('express');
const router = express.Router();
const pool = require('../db/index');


// POST /api/lists
// Create a new list for a board
router.post('/', async (req, res) => {
  try {
    const { board_id, title } = req.body;

    if (!board_id || !title) {
      return res.status(400).json({ message: 'board_id and title are required' });
    }

    // Ensure board exists
    const boardCheck = await pool.query(
      'SELECT id FROM boards WHERE id = $1',
      [board_id]
    );

    if (boardCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Get next position
    const maxPosRes = await pool.query(
      'SELECT COALESCE(MAX(position), 0) as max_pos FROM lists WHERE board_id = $1',
      [board_id]
    );

    const newPosition = parseInt(maxPosRes.rows[0].max_pos, 10) + 1;

    const result = await pool.query(
      'INSERT INTO lists (board_id, title, position) VALUES ($1, $2, $3) RETURNING *',
      [board_id, title, newPosition]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error('Error creating list:', err);
    res.status(500).json({ message: 'Server error creating list' });
  }
});


// PATCH /api/lists/reorder
// Reorder lists
router.patch('/reorder', async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        message: 'An array of items with id and position is required'
      });
    }

    // Validate structure
    for (const item of items) {
      if (!item.id || item.position === undefined) {
        return res.status(400).json({
          message: 'Each item must include id and position'
        });
      }
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const item of items) {
        await client.query(
          'UPDATE lists SET position = $1 WHERE id = $2',
          [item.position, item.id]
        );
      }

      await client.query('COMMIT');

    } catch (e) {

      await client.query('ROLLBACK');
      throw e;

    } finally {

      client.release();

    }

    res.json({ message: 'Lists reordered successfully' });

  } catch (err) {
    console.error('Error reordering lists:', err);
    res.status(500).json({ message: 'Server error reordering lists' });
  }
});


// PATCH /api/lists/:id
// Update list title
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const result = await pool.query(
      'UPDATE lists SET title = COALESCE($1, title) WHERE id = $2 RETURNING *',
      [title, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'List not found' });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating list' });
  }
});


// DELETE /api/lists/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM lists WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'List not found' });
    }

    res.json({ message: 'List deleted successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting list' });
  }
});

module.exports = router;