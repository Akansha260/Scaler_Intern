const express = require('express');
const router = express.Router();
const pool = require('../db/index');


// GET /api/cards/:id
// Get full card details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        c.*,

        (SELECT COALESCE(json_agg(
          json_build_object('id', l.id, 'name', l.name, 'color', l.color)
        ), '[]')
        FROM card_labels cl
        JOIN labels l ON l.id = cl.label_id
        WHERE cl.card_id = c.id) AS labels,

        (SELECT COALESCE(json_agg(
          json_build_object('id', u.id, 'name', u.name)
        ), '[]')
        FROM card_members cm
        JOIN users u ON u.id = cm.user_id
        WHERE cm.card_id = c.id) AS members,

        (SELECT COALESCE(json_agg(
          json_build_object(
            'id', ch.id,
            'title', ch.title,
            'items', (
              SELECT COALESCE(json_agg(
                json_build_object(
                  'id', chi.id,
                  'title', chi.title,
                  'is_completed', chi.is_completed
                )
              ), '[]')
              FROM checklist_items chi
              WHERE chi.checklist_id = ch.id
            )
          )
        ), '[]')
        FROM checklists ch
        WHERE ch.card_id = c.id) AS checklists

      FROM cards c
      WHERE c.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Card not found' });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching card details' });
  }
});


// POST /api/cards
// Create card
router.post('/', async (req, res) => {
  try {
    const { list_id, title } = req.body;

    if (!list_id || !title) {
      return res.status(400).json({
        message: 'list_id and title are required'
      });
    }

    // Ensure list exists
    const listCheck = await pool.query(
      'SELECT id FROM lists WHERE id = $1',
      [list_id]
    );

    if (listCheck.rows.length === 0) {
      return res.status(404).json({ message: 'List not found' });
    }

    const maxPosRes = await pool.query(
      'SELECT COALESCE(MAX(position),0) as max_pos FROM cards WHERE list_id = $1',
      [list_id]
    );

    const newPosition = parseInt(maxPosRes.rows[0].max_pos, 10) + 1;

    const result = await pool.query(
      'INSERT INTO cards (list_id, title, position) VALUES ($1,$2,$3) RETURNING *',
      [list_id, title, newPosition]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error('Error creating card:', err);
    res.status(500).json({ message: 'Server error creating card' });
  }
});


// PATCH /api/cards/move
// Move cards (drag & drop)
router.patch('/move', async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        message: 'Array of items with id, position, and list_id required'
      });
    }

    // Validate payload structure
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

        if (item.list_id !== undefined) {

          await client.query(
            'UPDATE cards SET position = $1, list_id = $2 WHERE id = $3',
            [item.position, item.list_id, item.id]
          );

        } else {

          await client.query(
            'UPDATE cards SET position = $1 WHERE id = $2',
            [item.position, item.id]
          );

        }

      }

      await client.query('COMMIT');

    } catch (e) {

      await client.query('ROLLBACK');
      throw e;

    } finally {

      client.release();

    }

    res.json({ message: 'Cards moved successfully' });

  } catch (err) {
    console.error('Error moving cards:', err);
    res.status(500).json({ message: 'Server error moving cards' });
  }
});


// PATCH /api/cards/:id
// Update card fields
router.patch('/:id', async (req, res) => {
  try {

    const { id } = req.params;
    const { title, description, due_date } = req.body;

    const result = await pool.query(
      `UPDATE cards
       SET title = COALESCE($1,title),
           description = COALESCE($2,description),
           due_date = COALESCE($3,due_date)
       WHERE id = $4
       RETURNING *`,
      [title, description, due_date, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Card not found' });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating card' });
  }
});


// DELETE /api/cards/:id
router.delete('/:id', async (req, res) => {
  try {

    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM cards WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Card not found' });
    }

    res.json({ message: 'Card deleted successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting card' });
  }
});

module.exports = router;