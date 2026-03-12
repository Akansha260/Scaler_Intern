-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

-- Boards
CREATE TABLE IF NOT EXISTS boards (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lists
CREATE TABLE IF NOT EXISTS lists (
  id SERIAL PRIMARY KEY,
  board_id INTEGER REFERENCES boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER
);

-- Cards
CREATE TABLE IF NOT EXISTS cards (
  id SERIAL PRIMARY KEY,
  list_id INTEGER REFERENCES lists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER,
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Labels
CREATE TABLE IF NOT EXISTS labels (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL
);

-- Card Labels (Many-to-Many)
CREATE TABLE IF NOT EXISTS card_labels (
  card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
  label_id INTEGER REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, label_id)
);

-- Card Members (Many-to-Many)
CREATE TABLE IF NOT EXISTS card_members (
  card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, user_id)
);

-- Checklists
CREATE TABLE IF NOT EXISTS checklists (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE
);

-- Checklist Items
CREATE TABLE IF NOT EXISTS checklist_items (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  checklist_id INTEGER REFERENCES checklists(id) ON DELETE CASCADE,
  position INTEGER
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lists_board_position
ON lists(board_id, position);

CREATE INDEX IF NOT EXISTS idx_cards_list_position
ON cards(list_id, position);