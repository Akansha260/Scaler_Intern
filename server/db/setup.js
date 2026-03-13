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
        board_id INTEGER REFERENCES boards(id) ON DELETE CASCADE,
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

      CREATE TABLE IF NOT EXISTS checklists (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
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

      ALTER TABLE cards ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
      ALTER TABLE cards ALTER COLUMN start_date TYPE TIMESTAMPTZ;
      ALTER TABLE cards ALTER COLUMN due_date TYPE TIMESTAMPTZ;
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
        ('Charlie Brown'),
        ('Diana Prince'),
        ('Edward Norton')
      RETURNING *;
    `);

    const users = usersRes.rows;

    // Insert board
    const boardRes = await client.query(`
      INSERT INTO boards (title) 
      VALUES ('Project Board')
      RETURNING *;
    `);

    const boardId = boardRes.rows[0].id;

    // Insert labels
    const labelsRes = await client.query(`
      INSERT INTO labels (board_id, name, color) VALUES 
        ($1, 'Priority', '#f87168'),
        ($1, 'In Progress', '#fea362'),
        ($1, 'Review', '#f5cd47'),
        ($1, 'Done', '#4bce97'),
        ($1, 'Research', '#9f8fef'),
        ($1, 'Bug', '#ae2e24')
      RETURNING *;
    `, [boardId]);

    const labels = labelsRes.rows;

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
 // Card seed data
const now = new Date();
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const inTwoDays = new Date(now.getTime() + 48 * 60 * 60 * 1000);

const cardsData = [
  {
    listId: lists[0].id, title: "Implement Auth Service", pos: 1,
    startDate: yesterday.toISOString(), dueDate: tomorrow.toISOString(),
    labelIndices: [0, 4], memberIndices: [0, 1, 2],
    checklists: [
      { title: "Task List", items: ["Setup JWT", "Config Passport", "Database migration"] }
    ]
  },
  {
    listId: lists[0].id, title: "Refactor UI Components", pos: 2,
    labelIndices: [1], memberIndices: [3],
    checklists: [
      { title: "Redesign", items: ["Header refine", "Sidebar update"] }
    ]
  },
  {
    listId: lists[1].id, title: "Heavy Collaboration Card", pos: 1,
    dueDate: inTwoDays.toISOString(),
    labelIndices: [1, 2, 4], memberIndices: [0, 1, 2, 3, 4],
    checklists: [
      { title: "Milestones", items: ["Idea", "Draft", "Review", "Release"] }
    ]
  },
  {
    listId: lists[1].id, title: "Critical Bug Investigation", pos: 2,
    dueDate: now.toISOString(),
    labelIndices: [0, 5], memberIndices: [1, 2]
  },
  {
    listId: lists[2].id, title: "Overdue Review Task", pos: 1,
    dueDate: yesterday.toISOString(),
    labelIndices: [2], memberIndices: [0]
  },
  {
    listId: lists[3].id, title: "Successfully Completed", pos: 1,
    isCompleted: true,
    dueDate: yesterday.toISOString(),
    labelIndices: [3], memberIndices: [4]
  }
];
  for (const c of cardsData) {

    const cardRes = await client.query(
      `INSERT INTO cards (title, list_id, position, start_date, due_date, is_completed)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        c.title,
        c.listId,
        c.pos,
        c.startDate || null,
        c.dueDate || null,
        c.isCompleted || false
      ]
    );

    const card = cardRes.rows[0];

    // Insert labels
    if (c.labelIndices) {
      for (const idx of c.labelIndices) {
        await client.query(
          `INSERT INTO card_labels (card_id, label_id) VALUES ($1, $2)`,
          [card.id, labels[idx].id]
        );
      }
    }

    // Insert members
    if (c.memberIndices) {
      for (const idx of c.memberIndices) {
        await client.query(
          `INSERT INTO card_members (card_id, user_id) VALUES ($1, $2)`,
          [card.id, users[idx].id]
        );
      }
    }

    // Insert checklists
    if (c.checklists) {

      let checklistPos = 1;

      for (const cl of c.checklists) {

        const clRes = await client.query(
          `INSERT INTO checklists (title, card_id, position)
          VALUES ($1, $2, $3)
          RETURNING id`,
          [cl.title, card.id, checklistPos++]
        );

        const checklistId = clRes.rows[0].id;

        for (let i = 0; i < cl.items.length; i++) {
          await client.query(
            `INSERT INTO checklist_items (title, checklist_id, position)
            VALUES ($1, $2, $3)`,
            [cl.items[i], checklistId, i + 1]
          );
        }

      }

    }

  }

  await client.query("COMMIT");

  console.log("Database seeded successfully with comprehensive data.");
  console.log(`Created: 1 board, 4 lists, ${cardsData.length} cards, 5 users, 6 labels`);

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
