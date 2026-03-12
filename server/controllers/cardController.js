const pool = require('../db/index');

const getCardDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        c.*,
        (SELECT COUNT(*)::INT FROM checklist_items ci JOIN checklists ch2 ON ch2.id = ci.checklist_id WHERE ch2.card_id = c.id AND ci.is_completed = true) as checklist_completed,
        (SELECT COUNT(*)::INT FROM checklist_items ci JOIN checklists ch2 ON ch2.id = ci.checklist_id WHERE ch2.card_id = c.id) as checklist_total,
        (SELECT COALESCE(json_agg(json_build_object('id', l.id, 'name', l.name, 'color', l.color)), '[]') FROM card_labels cl JOIN labels l ON l.id = cl.label_id WHERE cl.card_id = c.id) AS labels,
        (SELECT COALESCE(json_agg(json_build_object('id', u.id, 'name', u.name)), '[]') FROM card_members cm JOIN users u ON u.id = cm.user_id WHERE cm.card_id = c.id) AS members,
        (SELECT COALESCE(json_agg(json_build_object('id', ch.id, 'title', ch.title, 'items', (SELECT COALESCE(json_agg(json_build_object('id', chi.id, 'title', chi.title, 'is_completed', chi.is_completed, 'position', chi.position) ORDER BY chi.position), '[]') FROM checklist_items chi WHERE chi.checklist_id = ch.id))), '[]') FROM checklists ch WHERE ch.card_id = c.id) AS checklists
      FROM cards c WHERE c.id = $1
    `, [id]);

    if (result.rows.length === 0) return res.status(404).json({ message: 'Card not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching card details' });
  }
};

const createCard = async (req, res) => {
  try {
    const { list_id, title } = req.body;
    if (!list_id || !title) return res.status(400).json({ message: 'list_id and title are required' });
    
    const maxPosRes = await pool.query('SELECT COALESCE(MAX(position),0) as max_pos FROM cards WHERE list_id = $1', [list_id]);
    const newPosition = parseInt(maxPosRes.rows[0].max_pos, 10) + 1;
    const result = await pool.query('INSERT INTO cards (list_id, title, position) VALUES ($1,$2,$3) RETURNING *', [list_id, title, newPosition]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating card' });
  }
};

const moveCards = async (req, res) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items)) return res.status(400).json({ message: 'Array of items required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const item of items) {
      if (item.list_id !== undefined) {
        await client.query('UPDATE cards SET position = $1, list_id = $2 WHERE id = $3', [item.position, item.list_id, item.id]);
      } else {
        await client.query('UPDATE cards SET position = $1 WHERE id = $2', [item.position, item.id]);
      }
    }
    await client.query('COMMIT');
    res.json({ message: 'Cards moved successfully' });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ message: 'Error moving cards' });
  } finally {
    client.release();
  }
};

const updateCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, due_date, is_archived, is_completed } = req.body;
    const result = await pool.query(
      `UPDATE cards SET title = COALESCE($1,title), description = COALESCE($2,description), due_date = COALESCE($3,due_date), is_archived = COALESCE($4,is_archived), is_completed = COALESCE($5,is_completed) WHERE id = $6 RETURNING *`,
      [title, description, due_date, is_archived, is_completed, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Card not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating card' });
  }
};

const deleteCard = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM cards WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Card not found' });
    res.json({ message: 'Card deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting card' });
  }
};

const updateChecklistItem = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const { is_completed } = req.body;
    const result = await pool.query(
      `UPDATE checklist_items SET is_completed = $1 WHERE id = $2 AND checklist_id IN (SELECT id FROM checklists WHERE card_id = $3) RETURNING *`,
      [is_completed, itemId, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating checklist item' });
  }
};

const addChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const maxPosRes = await pool.query('SELECT COALESCE(MAX(position),0) as max_pos FROM checklists WHERE card_id = $1', [id]);
    const newPosition = parseInt(maxPosRes.rows[0].max_pos, 10) + 1;
    const result = await pool.query('INSERT INTO checklists (card_id, title, position) VALUES ($1, $2, $3) RETURNING *', [id, title, newPosition]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating checklist' });
  }
};

const addChecklistItem = async (req, res) => {
  try {
    const { checklistId } = req.params;
    const { title } = req.body;
    const maxPosRes = await pool.query('SELECT COALESCE(MAX(position), 0) as max_pos FROM checklist_items WHERE checklist_id = $1', [checklistId]);
    const newPosition = parseInt(maxPosRes.rows[0].max_pos, 10) + 1;
    const result = await pool.query('INSERT INTO checklist_items (checklist_id, title, position) VALUES ($1, $2, $3) RETURNING *', [checklistId, title, newPosition]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating checklist item' });
  }
};

const addLabel = async (req, res) => {
  try {
    const { id } = req.params;
    const { label_id } = req.body;
    await pool.query('INSERT INTO card_labels (card_id, label_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, label_id]);
    res.json({ message: 'Label added' });
  } catch (err) {
    res.status(500).json({ message: 'Error adding label' });
  }
};

const removeLabel = async (req, res) => {
  try {
    const { id, labelId } = req.params;
    await pool.query('DELETE FROM card_labels WHERE card_id = $1 AND label_id = $2', [id, labelId]);
    res.json({ message: 'Label removed' });
  } catch (err) {
    res.status(500).json({ message: 'Error removing label' });
  }
};

const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    await pool.query('INSERT INTO card_members (card_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, user_id]);
    res.json({ message: 'Member added' });
  } catch (err) {
    res.status(500).json({ message: 'Error adding member' });
  }
};

const removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    await pool.query('DELETE FROM card_members WHERE card_id = $1 AND user_id = $2', [id, userId]);
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ message: 'Error removing member' });
  }
};

const updateChecklist = async (req, res) => {
  try {
    const { id, checklistId } = req.params;
    const { title } = req.body;
    const result = await pool.query('UPDATE checklists SET title = COALESCE($1, title) WHERE id = $2 AND card_id = $3 RETURNING *', [title, checklistId, id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Checklist not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating checklist' });
  }
};

module.exports = {
  getCardDetails,
  createCard,
  moveCards,
  updateCard,
  deleteCard,
  updateChecklistItem,
  addChecklist,
  addChecklistItem,
  addLabel,
  removeLabel,
  addMember,
  removeMember,
  updateChecklist
};
