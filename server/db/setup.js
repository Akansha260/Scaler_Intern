const pool = require("./index");

async function setupAndSeed() {
  const client = await pool.connect();

  try {
    console.log("Starting database setup and seed...");
    await client.query("BEGIN");

    // Base tables expected by the rest of the app
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS boards (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS lists (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        position INTEGER NOT NULL,
        board_id INTEGER REFERENCES boards(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS cards (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        list_id INTEGER REFERENCES lists(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        start_date TIMESTAMPTZ,
        due_date TIMESTAMPTZ,
        is_completed BOOLEAN NOT NULL DEFAULT FALSE
      );

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
        card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
        position INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS checklist_items (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        checklist_id INTEGER REFERENCES checklists(id) ON DELETE CASCADE,
        position INTEGER NOT NULL DEFAULT 1,
        is_completed BOOLEAN NOT NULL DEFAULT FALSE
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

    // Safety migrations for older local DBs
    await client.query(`
      ALTER TABLE cards ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
      ALTER TABLE cards ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;
      ALTER TABLE cards ADD COLUMN IF NOT EXISTS is_completed BOOLEAN NOT NULL DEFAULT FALSE;

      ALTER TABLE cards ALTER COLUMN start_date TYPE TIMESTAMPTZ;
      ALTER TABLE cards ALTER COLUMN due_date TYPE TIMESTAMPTZ;

      ALTER TABLE checklists ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE checklist_items ADD COLUMN IF NOT EXISTS is_completed BOOLEAN NOT NULL DEFAULT FALSE;
    `);

    console.log("Tables verified / created.");

    // This fixes repeated users and repeated demo data:
    // every seed starts from a clean state.
    await client.query(`
      TRUNCATE TABLE
        card_labels,
        card_members,
        checklist_items,
        checklists,
        comments,
        labels,
        cards,
        lists,
        boards,
        users
      RESTART IDENTITY CASCADE;
    `);

    console.log("Old data cleared.");

    // Insert users
    const usersRes = await client.query(
      `
      INSERT INTO users (name)
      VALUES
        ('Alice Smith'),
        ('Bob Jones'),
        ('Charlie Brown'),
        ('Diana Prince'),
        ('Edward Norton')
      RETURNING *;
      `
    );

    const users = usersRes.rows;

    // Insert board
    const boardRes = await client.query(
      `
      INSERT INTO boards (title)
      VALUES ('Project Board')
      RETURNING *;
      `
    );

    const boardId = boardRes.rows[0].id;

    // Insert labels
    const labelsRes = await client.query(
      `
      INSERT INTO labels (board_id, name, color)
      VALUES
        ($1, 'Priority', '#f87168'),
        ($1, 'In Progress', '#fea362'),
        ($1, 'Review', '#f5cd47'),
        ($1, 'Done', '#4bce97'),
        ($1, 'Research', '#9f8fef'),
        ($1, 'Bug', '#ae2e24')
      RETURNING *;
      `,
      [boardId]
    );

    const labels = labelsRes.rows;

    // Insert lists
    const listsRes = await client.query(
      `
      INSERT INTO lists (title, position, board_id)
      VALUES
        ('Todo', 1, $1),
        ('In Progress', 2, $1),
        ('Review', 3, $1),
        ('Done', 4, $1)
      RETURNING *;
      `,
      [boardId]
    );

    const lists = listsRes.rows;

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const inTwoDays = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const inThreeDays = new Date(now.getTime() + 72 * 60 * 60 * 1000);

    const cardsData = [
      {
        listId: lists[0].id,
        title: "Implement Auth Service",
        pos: 1,
        startDate: yesterday.toISOString(),
        dueDate: tomorrow.toISOString(),
        isCompleted: false,
        labelIndices: [0, 4],
        memberIndices: [0, 1, 2],
        checklists: [
          {
            title: "Backend Setup",
            items: [
              { title: "Setup JWT", isCompleted: true },
              { title: "Add auth middleware", isCompleted: true },
              { title: "Protect routes", isCompleted: false },
              { title: "Test login flow", isCompleted: false }
            ]
          },
          {
            title: "Database Work",
            items: [
              { title: "Review users schema", isCompleted: true },
              { title: "Add hashed password support", isCompleted: false },
              { title: "Validate login query", isCompleted: false }
            ]
          }
        ]
      },
      {
        listId: lists[0].id,
        title: "Refactor UI Components",
        pos: 2,
        startDate: now.toISOString(),
        dueDate: inTwoDays.toISOString(),
        isCompleted: false,
        labelIndices: [1],
        memberIndices: [3],
        checklists: [
          {
            title: "Redesign",
            items: [
              { title: "Header refine", isCompleted: true },
              { title: "Sidebar update", isCompleted: false },
              { title: "Improve card spacing", isCompleted: false },
              { title: "Fix modal layout", isCompleted: false }
            ]
          }
        ]
      },
      {
        listId: lists[1].id,
        title: "Heavy Collaboration Card",
        pos: 1,
        startDate: now.toISOString(),
        dueDate: inThreeDays.toISOString(),
        isCompleted: false,
        labelIndices: [1, 2, 4],
        memberIndices: [0, 1, 2, 3, 4],
        checklists: [
          {
            title: "Milestones",
            items: [
              { title: "Idea", isCompleted: true },
              { title: "Draft", isCompleted: true },
              { title: "Review", isCompleted: false },
              { title: "Release", isCompleted: false }
            ]
          },
          {
            title: "Coordination",
            items: [
              { title: "Assign owners", isCompleted: true },
              { title: "Collect feedback", isCompleted: false },
              { title: "Merge changes", isCompleted: false }
            ]
          }
        ]
      },
      {
        listId: lists[1].id,
        title: "Critical Bug Investigation",
        pos: 2,
        startDate: yesterday.toISOString(),
        dueDate: now.toISOString(),
        isCompleted: false,
        labelIndices: [0, 5],
        memberIndices: [1, 2],
        checklists: [
          {
            title: "Bug Hunt",
            items: [
              { title: "Reproduce issue", isCompleted: true },
              { title: "Check backend logs", isCompleted: true },
              { title: "Trace failing API", isCompleted: false },
              { title: "Write fix", isCompleted: false },
              { title: "Retest edge case", isCompleted: false }
            ]
          }
        ]
      },
      {
        listId: lists[2].id,
        title: "Overdue Review Task",
        pos: 1,
        startDate: yesterday.toISOString(),
        dueDate: yesterday.toISOString(),
        isCompleted: false,
        labelIndices: [2],
        memberIndices: [0],
        checklists: [
          {
            title: "Review Steps",
            items: [
              { title: "Read PR carefully", isCompleted: true },
              { title: "Test locally", isCompleted: false },
              { title: "Leave review comments", isCompleted: false }
            ]
          }
        ]
      },
      {
        listId: lists[3].id,
        title: "Successfully Completed",
        pos: 1,
        startDate: yesterday.toISOString(),
        dueDate: yesterday.toISOString(),
        isCompleted: true,
        labelIndices: [3],
        memberIndices: [4],
        checklists: [
          {
            title: "Completion",
            items: [
              { title: "Final QA", isCompleted: true },
              { title: "Deploy changes", isCompleted: true },
              { title: "Mark done", isCompleted: true }
            ]
          }
        ]
      }
    ];

    for (const c of cardsData) {
      const cardRes = await client.query(
        `
        INSERT INTO cards (title, list_id, position, start_date, due_date, is_completed)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
        `,
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

      if (c.labelIndices?.length) {
        for (const idx of c.labelIndices) {
          await client.query(
            `
            INSERT INTO card_labels (card_id, label_id)
            VALUES ($1, $2);
            `,
            [card.id, labels[idx].id]
          );
        }
      }

      if (c.memberIndices?.length) {
        for (const idx of c.memberIndices) {
          await client.query(
            `
            INSERT INTO card_members (card_id, user_id)
            VALUES ($1, $2);
            `,
            [card.id, users[idx].id]
          );
        }
      }

      if (c.checklists?.length) {
        let checklistPos = 1;

        for (const cl of c.checklists) {
          const checklistRes = await client.query(
            `
            INSERT INTO checklists (title, card_id, position)
            VALUES ($1, $2, $3)
            RETURNING id;
            `,
            [cl.title, card.id, checklistPos++]
          );

          const checklistId = checklistRes.rows[0].id;

          for (let i = 0; i < cl.items.length; i++) {
            const item = cl.items[i];

            await client.query(
              `
              INSERT INTO checklist_items (title, checklist_id, position, is_completed)
              VALUES ($1, $2, $3, $4);
              `,
              [item.title, checklistId, i + 1, item.isCompleted ?? false]
            );
          }
        }
      }
    }

    await client.query("COMMIT");

    console.log("Database seeded successfully.");
    console.log(
      `Created: 1 board, 4 lists, ${cardsData.length} cards, 5 users, 6 labels`
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Database setup failed:", err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

setupAndSeed();