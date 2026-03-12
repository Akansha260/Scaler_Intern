const express = require('express');
const router = express.Router();
const pool = require('../db/index');

// GET /api/boards/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
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
                    'dueDate', c.due_date,
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
                    )
                  ) ORDER BY c.position
                ), '[]'::json)
                FROM cards c WHERE c.list_id = l.id
              )
            ) ORDER BY l.position
          ), '[]'::json)
          FROM lists l WHERE l.board_id = b.id
        ) as lists
      FROM boards b
      WHERE b.id = $1
    `;

    const result = await pool.query(query, [id]);

    if(result.rows.length === 0) {
      return res.status(404).json({ message: 'Board not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching board:', err);
    res.status(500).json({ message: 'Server error fetching board' });
  }
});

module.exports = router;
