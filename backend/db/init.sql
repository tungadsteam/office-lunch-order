-- Lunch Fund Management System - Database Schema
-- PostgreSQL 15+
-- IDEMPOTENT: Safe to run multiple times — uses IF NOT EXISTS and ON CONFLICT DO NOTHING

-- ==========================================
-- 1. USERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),

  -- Financial
  balance DECIMAL(12, 2) DEFAULT 0.00,

  -- Rotation tracking
  last_bought_date DATE,
  rotation_index INTEGER DEFAULT 0,
  total_bought_times INTEGER DEFAULT 0,

  -- Notifications
  fcm_token TEXT,
  notification_enabled BOOLEAN DEFAULT true,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_rotation ON users(rotation_index, last_bought_date);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;

-- ==========================================
-- 2. LUNCH SESSIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS lunch_sessions (
  id SERIAL PRIMARY KEY,
  session_date DATE NOT NULL UNIQUE,

  -- Workflow status
  status VARCHAR(30) DEFAULT 'ordering' CHECK (
    status IN ('ordering', 'buyers_selected', 'buying', 'payment_submitted', 'settled', 'cancelled')
  ),

  -- Buyers (4 người đi mua)
  buyer_ids INTEGER[] DEFAULT '{}',
  selected_at TIMESTAMP,

  -- Payment
  payer_id INTEGER REFERENCES users(id),
  total_bill DECIMAL(12, 2),
  amount_per_person DECIMAL(12, 2),
  bill_image_url TEXT,
  paid_at TIMESTAMP,

  -- Metadata
  total_participants INTEGER DEFAULT 0,
  notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_date ON lunch_sessions(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON lunch_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_buyers ON lunch_sessions USING GIN(buyer_ids);

-- ==========================================
-- 3. TRANSACTIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Transaction type
  type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'income', 'expense', 'refund', 'adjustment')),
  amount DECIMAL(12, 2) NOT NULL,

  -- Deposit workflow
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_id INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,

  -- Linking
  order_id INTEGER REFERENCES lunch_sessions(id),

  -- Details
  note TEXT,
  metadata JSONB,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_transactions_order ON transactions(order_id);

-- ==========================================
-- 4. LUNCH ORDERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS lunch_orders (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES lunch_sessions(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cancelled_at TIMESTAMP,

  UNIQUE(session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_orders_session ON lunch_orders(session_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_user ON lunch_orders(user_id, created_at DESC);

-- ==========================================
-- 5. ADMIN SETTINGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS admin_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial settings — ON CONFLICT DO NOTHING preserves existing admin-edited values
INSERT INTO admin_settings (key, value, description) VALUES
  ('bank_account_number', '1234567890', 'Số tài khoản ngân hàng admin'),
  ('bank_account_name', 'NGUYEN VAN A', 'Tên chủ tài khoản'),
  ('bank_name', 'Vietcombank', 'Tên ngân hàng'),
  ('buyer_count', '4', 'Số người đi mua mỗi ngày'),
  ('order_deadline_time', '11:30', 'Giờ chốt sổ đặt cơm'),
  ('low_balance_threshold', '30000', 'Ngưỡng cảnh báo số dư thấp')
ON CONFLICT (key) DO NOTHING;

-- ==========================================
-- 6. NOTIFICATION LOGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS notification_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  body TEXT,
  data JSONB,
  status VARCHAR(20) DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON notification_logs(user_id, created_at DESC);

-- ==========================================
-- 7. SNACK MENUS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS snack_menus (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),

  status VARCHAR(20) DEFAULT 'ordering' CHECK (
    status IN ('ordering', 'settled', 'cancelled')
  ),

  total_amount DECIMAL(12, 2) DEFAULT 0,
  settled_at TIMESTAMP,
  settled_by INTEGER REFERENCES users(id),

  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_snack_menus_created_by ON snack_menus(created_by);
CREATE INDEX IF NOT EXISTS idx_snack_menus_status ON snack_menus(status);
CREATE INDEX IF NOT EXISTS idx_snack_menus_date ON snack_menus(created_at DESC);

-- ==========================================
-- 8. SNACK ITEMS TABLE (mobile model)
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
-- 9. SNACK MENU ITEMS TABLE (web model)
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
-- 10. SNACK USER ORDERS TABLE (web model)
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

-- ==========================================
-- 11. REIMBURSEMENT REQUESTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS reimbursement_requests (
  id SERIAL PRIMARY KEY,

  type VARCHAR(20) NOT NULL CHECK (type IN ('lunch', 'snack')),
  reference_id INTEGER NOT NULL,

  settler_id INTEGER NOT NULL REFERENCES users(id),
  total_amount DECIMAL(12, 2) NOT NULL,

  status VARCHAR(30) DEFAULT 'pending' CHECK (
    status IN ('pending', 'admin_transferred', 'user_confirmed', 'user_disputed')
  ),

  admin_id INTEGER REFERENCES users(id),
  admin_note TEXT,
  admin_transferred_at TIMESTAMP,

  user_response VARCHAR(20) CHECK (user_response IN ('received', 'not_received')),
  user_confirmed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reimbursements_settler ON reimbursement_requests(settler_id);
CREATE INDEX IF NOT EXISTS idx_reimbursements_status ON reimbursement_requests(status);
CREATE INDEX IF NOT EXISTS idx_reimbursements_type_ref ON reimbursement_requests(type, reference_id);

-- ==========================================
-- TRIGGERS
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PostgreSQL 14+ supports CREATE OR REPLACE TRIGGER
CREATE OR REPLACE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON lunch_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_snack_menus_updated_at
  BEFORE UPDATE ON snack_menus
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_snack_user_orders_updated_at
  BEFORE UPDATE ON snack_user_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_reimbursements_updated_at
  BEFORE UPDATE ON reimbursement_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- SEED DATA (for first-time setup only)
-- ON CONFLICT DO NOTHING ensures existing production data is never overwritten
-- ==========================================

-- Admin user (password: Admin123!)
INSERT INTO users (email, password_hash, name, role, balance) VALUES
  ('admin@lunchfund.com', '$2b$10$EGLpmzJhsjZ8Ac13V1Mf0OUZQjwE7el82gmED1D137aQn8AMVe1Wy', 'Admin User', 'admin', 0)
ON CONFLICT (email) DO NOTHING;

COMMENT ON TABLE users IS 'User accounts with balance and rotation tracking';
COMMENT ON TABLE lunch_sessions IS 'Daily lunch sessions with buyer selection and settlement';
COMMENT ON TABLE transactions IS 'Financial transactions (deposit, expense, refund)';
COMMENT ON TABLE lunch_orders IS 'User orders for each lunch session';
COMMENT ON TABLE admin_settings IS 'System configuration settings';
COMMENT ON TABLE notification_logs IS 'Push notification delivery logs';
COMMENT ON TABLE snack_menus IS 'Snack/extra orders outside of lunch sessions';
COMMENT ON TABLE snack_items IS 'Individual snack order items (mobile model)';
COMMENT ON TABLE snack_menu_items IS 'Pre-defined menu items for snack orders (web model)';
COMMENT ON TABLE snack_user_orders IS 'User selections from snack menu items';
COMMENT ON TABLE reimbursement_requests IS 'Admin reimbursement tracking for lunch and snack settlers';
