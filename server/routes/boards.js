const express = require('express');
const router = express.Router();
const pool = require('../db/index');

// GET /api/boards
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, title FROM boards ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching boards:', err);
    res.status(500).json({ message: 'Server error fetching boards' });
  }
});

// POST /api/boards
router.post('/', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const boardRes = await client.query(
        'INSERT INTO boards (title) VALUES ($1) RETURNING *',
        [title]
      );
      const newBoard = boardRes.rows[0];

      // Add default labels
      const defaultLabels = [
        { name: '', color: '#4bce97' }, // Green
        { name: '', color: '#f5cd47' }, // Yellow
        { name: '', color: '#fea362' }, // Orange
        { name: '', color: '#f87168' }, // Red
        { name: '', color: '#9f8fef' }, // Purple
      ];

      for (const label of defaultLabels) {
        await client.query(
          'INSERT INTO labels (board_id, name, color) VALUES ($1, $2, $3)',
          [newBoard.id, label.name, label.color]
        );
      }

      await client.query('COMMIT');
      res.status(201).json(newBoard);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error creating board:', err);
    res.status(500).json({ message: 'Server error creating board' });
  }
});

// GET /api/boards/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // stronger numeric validation
    if (!/^\d+$/.test(id)) {
      return res.status(404).json({ message: 'Invalid board ID' });
    }

    const query = `
      SELECT 
        b.id,
        b.title,
        (
          SELECT COALESCE(json_agg(
            json_build_object(
              'id', l.id,
              'title', l.title,
              'position', l.position,
              'cards', (
                SELECT COALESCE(json_agg(
                  json_build_object(
                    'id', c.id,
                    'title', c.title,
                    'position', c.position,
                    'description', c.description,
                    'due_date', c.due_date,
                    'checklist_completed', (
                      SELECT COUNT(*)::INT
                      FROM checklist_items ci
                      JOIN checklists ch2 ON ch2.id = ci.checklist_id
                      WHERE ch2.card_id = c.id AND ci.is_completed = true
                    ),
                    'checklist_total', (
                      SELECT COUNT(*)::INT
                      FROM checklist_items ci
                      JOIN checklists ch2 ON ch2.id = ci.checklist_id
                      WHERE ch2.card_id = c.id
                    ),
                    'labels', (
                      SELECT COALESCE(json_agg(
                        json_build_object('id', lb.id, 'name', lb.name, 'color', lb.color)
                      ), '[]'::json)
                      FROM card_labels cl 
                      JOIN labels lb ON lb.id = cl.label_id
                      WHERE cl.card_id = c.id
                    ),
                    'members', (
                      SELECT COALESCE(json_agg(
                        json_build_object('id', u.id, 'name', u.name)
                      ), '[]'::json)
                      FROM card_members cm
                      JOIN users u ON u.id = cm.user_id
                      WHERE cm.card_id = c.id
                    ),
                    'is_completed', c.is_completed
                  ) ORDER BY c.position
                ), '[]'::json)
                FROM cards c 
                WHERE c.list_id = l.id AND c.is_archived = false
              )
            ) ORDER BY l.position
          ), '[]'::json)
          FROM lists l WHERE l.board_id = b.id
        ) as lists
      FROM boards b
      WHERE b.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Board not found' });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error('Error fetching board:', err);
    res.status(500).json({ message: 'Server error fetching board' });
  }
});

// GET /api/boards/:id/archived
router.get('/:id/archived', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT c.*, l.title as list_title
      FROM cards c
      JOIN lists l ON l.id = c.list_id
      WHERE l.board_id = $1 AND c.is_archived = true
      ORDER BY c.created_at DESC
    `, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching archived cards:', err);
    res.status(500).json({ message: 'Server error fetching archived cards' });
  }
});


// DELETE /api/boards/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM boards WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Board not found' });
    }
    
    res.json({ message: 'Board deleted successfully', board: result.rows[0] });
  } catch (err) {
    console.error('Error deleting board:', err);
    res.status(500).json({ message: 'Server error deleting board' });
  }
});


module.exports = router;