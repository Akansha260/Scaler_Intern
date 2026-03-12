const pool = require('./index');

async function setupAndSeed() {
  const client = await pool.connect();

  try {
    console.log("Starting database setup and seed...");

    await client.query("BEGIN");

    // Create tables if not exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS labels (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS card_labels (
        card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
        label_id INTEGER REFERENCES labels(id) ON DELETE CASCADE,
        PRIMARY KEY (card_id, label_id)
      );

      CREATE TABLE IF NOT EXISTS card_members (
        card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        PRIMARY KEY (card_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS checklists (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS checklist_items (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        is_completed BOOLEAN DEFAULT false,
        checklist_id INTEGER REFERENCES checklists(id) ON DELETE CASCADE,
        position INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_lists_board_position 
      ON lists (board_id, position);

      CREATE INDEX IF NOT EXISTS idx_cards_list_position 
      ON cards (list_id, position);
    `);

    console.log("Tables verified / created.");

    // Clear old data
    await client.query(`
      TRUNCATE TABLE 
        users,
        boards,
        lists,
        cards,
        labels,
        card_labels,
        card_members,
        checklists,
        checklist_items,
        comments
      RESTART IDENTITY CASCADE;
    `);

    console.log("Old data cleared.");

    // Insert users
    const usersRes = await client.query(`
      INSERT INTO users (name) VALUES 
        ('Alice Smith'),
        ('Bob Jones'),
        ('Charlie Brown')
      RETURNING *;
    `);

    const users = usersRes.rows;

    // Insert labels
    const labelsRes = await client.query(`
      INSERT INTO labels (name, color) VALUES 
        ('Bug', 'red'),
        ('Feature', 'blue'),
        ('Enhancement', 'green')
      RETURNING *;
    `);

    const labels = labelsRes.rows;

    // Insert board
    const boardRes = await client.query(`
      INSERT INTO boards (title) 
      VALUES ('Project Board')
      RETURNING *;
    `);

    const boardId = boardRes.rows[0].id;

    // Insert lists
    const listsRes = await client.query(`
      INSERT INTO lists (title, position, board_id) VALUES
        ('Todo', 1, $1),
        ('In Progress', 2, $1),
        ('Review', 3, $1),
        ('Done', 4, $1)
      RETURNING *;
    `, [boardId]);

    const lists = listsRes.rows;

    // Card seed data
    const cardsData = [
      { listId: lists[0].id, title: "Setup database", pos: 1 },
      { listId: lists[0].id, title: "Create Next.js app", pos: 2 },
      { listId: lists[0].id, title: "Write seed script", pos: 3 },
      { listId: lists[0].id, title: "Plan component structure", pos: 4 },

      { listId: lists[1].id, title: "Implement Express API", pos: 1 },
      { listId: lists[1].id, title: "Configure Tailwind", pos: 2 },
      { listId: lists[1].id, title: "Design DB schema", pos: 3 },

      { listId: lists[2].id, title: "Review PR for drag and drop", pos: 1 },
      { listId: lists[2].id, title: "Design tweaks", pos: 2 },

      { listId: lists[3].id, title: "Project Kickoff", pos: 1 }
    ];

    for (const c of cardsData) {

      const cardRes = await client.query(`
        INSERT INTO cards (title, list_id, position)
        VALUES ($1, $2, $3)
        RETURNING *;
      `, [c.title, c.listId, c.pos]);

      const card = cardRes.rows[0];

      // Assign label to some cards
      if (c.pos === 1) {
        await client.query(
          `INSERT INTO card_labels (card_id, label_id)
           VALUES ($1, $2)`,
          [card.id, labels[0].id]
        );
      }

      // Assign member
      if (c.pos <= 2) {
        await client.query(
          `INSERT INTO card_members (card_id, user_id)
           VALUES ($1, $2)`,
          [card.id, users[0].id]
        );
      }

    }

    await client.query("COMMIT");

    console.log("Database seeded successfully.");
    console.log("Created:");
    console.log("1 board, 4 lists, 10 cards, 3 users, 3 labels");

    process.exit(0);

  } catch (err) {

    await client.query("ROLLBACK");
    console.error("Database setup failed:", err);

    process.exit(1);

  } finally {
    client.release();
  }
}

setupAndSeed();