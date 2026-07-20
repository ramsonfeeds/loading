export const schemaSql = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  english_name TEXT NOT NULL,
  tamil_name TEXT NOT NULL,
  weight REAL NOT NULL CHECK (weight > 0),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  product_type TEXT NOT NULL DEFAULT 'MANUFACTURED' CHECK (product_type IN ('MANUFACTURED', 'PURCHASED')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS products_search_idx ON products (english_name, tamil_name);
CREATE INDEX IF NOT EXISTS products_active_idx ON products (active);
CREATE INDEX IF NOT EXISTS products_product_type_idx ON products (product_type);

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
  factory TEXT NOT NULL DEFAULT 'R' CHECK (factory IN ('R', 'S')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (dispatch_id) REFERENCES dispatches(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS dispatch_groups_dispatch_sort_idx ON dispatch_groups (dispatch_id, sort_order);
CREATE INDEX IF NOT EXISTS dispatch_groups_factory_idx ON dispatch_groups (factory);

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

CREATE TABLE IF NOT EXISTS dispatch_allocations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  factory TEXT NOT NULL CHECK (factory IN ('R', 'S')),
  source TEXT NOT NULL CHECK (source IN ('STOCK', 'PRODUCTION')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (item_id) REFERENCES dispatch_items(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS dispatch_allocations_item_idx ON dispatch_allocations (item_id);
CREATE INDEX IF NOT EXISTS dispatch_allocations_factory_source_idx ON dispatch_allocations (factory, source);

CREATE TABLE IF NOT EXISTS production_lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  production_date TEXT NOT NULL,
  title TEXT NOT NULL,
  factory TEXT NOT NULL CHECK (factory IN ('R', 'S')),
  source_dispatch_id INTEGER NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (source_dispatch_id) REFERENCES dispatches(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS production_lists_date_idx ON production_lists (production_date);
CREATE INDEX IF NOT EXISTS production_lists_factory_idx ON production_lists (factory);
CREATE INDEX IF NOT EXISTS production_lists_source_dispatch_idx ON production_lists (source_dispatch_id);

CREATE TABLE IF NOT EXISTS production_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  production_list_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  sort_order INTEGER NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'MANUAL' CHECK (source_type IN ('AUTO', 'MANUAL')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (production_list_id) REFERENCES production_lists(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS production_items_list_sort_idx ON production_items (production_list_id, sort_order);
CREATE INDEX IF NOT EXISTS production_items_product_idx ON production_items (product_id);
CREATE INDEX IF NOT EXISTS production_items_source_type_idx ON production_items (source_type);

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
