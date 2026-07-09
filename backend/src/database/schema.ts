export const schemaSql = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  english_name TEXT NOT NULL,
  tamil_name TEXT NOT NULL,
  weight REAL NOT NULL CHECK (weight > 0),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS products_search_idx ON products (english_name, tamil_name);
CREATE INDEX IF NOT EXISTS products_active_idx ON products (active);

CREATE TABLE IF NOT EXISTS dispatches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dispatch_date TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS dispatches_date_idx ON dispatches (dispatch_date);

CREATE TABLE IF NOT EXISTS dispatch_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dispatch_id INTEGER NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (dispatch_id) REFERENCES dispatches(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS dispatch_groups_dispatch_sort_idx ON dispatch_groups (dispatch_id, sort_order);

CREATE TABLE IF NOT EXISTS dispatch_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  description TEXT NULL,
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (group_id) REFERENCES dispatch_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS dispatch_items_group_sort_idx ON dispatch_items (group_id, sort_order);
CREATE INDEX IF NOT EXISTS dispatch_items_product_idx ON dispatch_items (product_id);

CREATE TRIGGER IF NOT EXISTS products_updated_at
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
  UPDATE products SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS dispatches_updated_at
AFTER UPDATE ON dispatches
FOR EACH ROW
BEGIN
  UPDATE dispatches SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS dispatch_groups_updated_at
AFTER UPDATE ON dispatch_groups
FOR EACH ROW
BEGIN
  UPDATE dispatch_groups SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS dispatch_items_updated_at
AFTER UPDATE ON dispatch_items
FOR EACH ROW
BEGIN
  UPDATE dispatch_items SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;
`;
