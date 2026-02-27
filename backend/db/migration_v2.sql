-- Migration v2: Snack Menu + Reimbursement Flow
-- NOTE: These tables are now included in init.sql (idempotent).
-- This file is kept for reference. Safe to run on existing DBs.

-- ==========================================
-- 1. SNACK MENUS TABLE
-- Ai cũng tạo được (not admin-only)
-- ==========================================
CREATE TABLE IF NOT EXISTS snack_menus (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),

  -- Workflow status
  status VARCHAR(20) DEFAULT 'ordering' CHECK (
    status IN ('ordering', 'settled', 'cancelled')
  ),

  -- Settlement info
  total_amount DECIMAL(12, 2) DEFAULT 0,
  settled_at TIMESTAMP,
  settled_by INTEGER REFERENCES users(id), -- who clicked "Chốt đơn"

  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_snack_menus_created_by ON snack_menus(created_by);
CREATE INDEX IF NOT EXISTS idx_snack_menus_status ON snack_menus(status);
CREATE INDEX IF NOT EXISTS idx_snack_menus_date ON snack_menus(created_at DESC);

-- ==========================================
-- 2. SNACK ITEMS TABLE (mobile model)
-- Each user's freeform order items within a snack menu
-- ==========================================
CREATE TABLE IF NOT EXISTS snack_items (
  id SERIAL PRIMARY KEY,
  snack_menu_id INTEGER NOT NULL REFERENCES snack_menus(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),

  item_name VARCHAR(255) NOT NULL,
  price DECIMAL(12, 2) NOT NULL CHECK (price > 0),
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_snack_items_menu ON snack_items(snack_menu_id);
CREATE INDEX IF NOT EXISTS idx_snack_items_user ON snack_items(user_id);

-- ==========================================
-- 2b. SNACK MENU ITEMS TABLE (web model)
-- Pre-defined items in a snack menu (restaurant-style)
-- ==========================================
CREATE TABLE IF NOT EXISTS snack_menu_items (
  id SERIAL PRIMARY KEY,
  snack_menu_id INTEGER NOT NULL REFERENCES snack_menus(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  price DECIMAL(12, 2) NOT NULL CHECK (price > 0),
  description TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_snack_menu_items_menu ON snack_menu_items(snack_menu_id);

-- ==========================================
-- 2c. SNACK USER ORDERS TABLE (web model)
-- User's selections from a snack menu
-- ==========================================
CREATE TABLE IF NOT EXISTS snack_user_orders (
  id SERIAL PRIMARY KEY,
  snack_menu_id INTEGER NOT NULL REFERENCES snack_menus(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  item_id INTEGER NOT NULL REFERENCES snack_menu_items(id) ON DELETE CASCADE,

  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(snack_menu_id, user_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_snack_user_orders_menu ON snack_user_orders(snack_menu_id);
CREATE INDEX IF NOT EXISTS idx_snack_user_orders_user ON snack_user_orders(user_id);

CREATE OR REPLACE TRIGGER update_snack_user_orders_updated_at
  BEFORE UPDATE ON snack_user_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 3. REIMBURSEMENT REQUESTS TABLE
-- Tracks admin -> user bank transfers
-- Used for both lunch AND snack settlements
-- ==========================================
CREATE TABLE IF NOT EXISTS reimbursement_requests (
  id SERIAL PRIMARY KEY,

  -- What triggered this reimbursement
  type VARCHAR(20) NOT NULL CHECK (type IN ('lunch', 'snack')),
  reference_id INTEGER NOT NULL, -- lunch_session_id or snack_menu_id

  -- Who needs to be reimbursed
  settler_id INTEGER NOT NULL REFERENCES users(id),
  total_amount DECIMAL(12, 2) NOT NULL,

  -- Workflow
  -- pending -> admin marks transferred -> user confirms received/disputes
  status VARCHAR(30) DEFAULT 'pending' CHECK (
    status IN ('pending', 'admin_transferred', 'user_confirmed', 'user_disputed')
  ),

  -- Admin action
  admin_id INTEGER REFERENCES users(id),
  admin_note TEXT,
  admin_transferred_at TIMESTAMP,

  -- User confirmation
  user_response VARCHAR(20) CHECK (user_response IN ('received', 'not_received')),
  user_confirmed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reimbursements_settler ON reimbursement_requests(settler_id);
CREATE INDEX IF NOT EXISTS idx_reimbursements_status ON reimbursement_requests(status);
CREATE INDEX IF NOT EXISTS idx_reimbursements_type_ref ON reimbursement_requests(type, reference_id);

-- ==========================================
-- TRIGGERS for new tables
-- ==========================================
CREATE OR REPLACE TRIGGER update_snack_menus_updated_at
  BEFORE UPDATE ON snack_menus
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_reimbursements_updated_at
  BEFORE UPDATE ON reimbursement_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
