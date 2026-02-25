-- Lunch Fund Management System - Database Schema
-- PostgreSQL 15+

-- Drop tables if exists (for clean re-init)
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP TABLE IF EXISTS lunch_orders CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS lunch_sessions CASCADE;
DROP TABLE IF EXISTS admin_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ==========================================
-- 1. USERS TABLE
-- ==========================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  
  -- Financial
  balance DECIMAL(12, 2) DEFAULT 0.00 CHECK (balance >= 0),
  
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

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_rotation ON users(rotation_index, last_bought_date);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- ==========================================
-- 2. LUNCH SESSIONS TABLE
-- ==========================================
CREATE TABLE lunch_sessions (
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

CREATE INDEX idx_sessions_date ON lunch_sessions(session_date DESC);
CREATE INDEX idx_sessions_status ON lunch_sessions(status);
CREATE INDEX idx_sessions_buyers ON lunch_sessions USING GIN(buyer_ids);

-- ==========================================
-- 3. TRANSACTIONS TABLE
-- ==========================================
CREATE TABLE transactions (
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

CREATE INDEX idx_transactions_user ON transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status) WHERE status = 'pending';
CREATE INDEX idx_transactions_order ON transactions(order_id);

-- ==========================================
-- 4. LUNCH ORDERS TABLE
-- ==========================================
CREATE TABLE lunch_orders (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES lunch_sessions(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cancelled_at TIMESTAMP,
  
  UNIQUE(session_id, user_id)
);

CREATE INDEX idx_orders_session ON lunch_orders(session_id, status);
CREATE INDEX idx_orders_user ON lunch_orders(user_id, created_at DESC);

-- ==========================================
-- 5. ADMIN SETTINGS TABLE
-- ==========================================
CREATE TABLE admin_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial settings
INSERT INTO admin_settings (key, value, description) VALUES
  ('bank_account_number', '1234567890', 'Số tài khoản ngân hàng admin'),
  ('bank_account_name', 'NGUYEN VAN A', 'Tên chủ tài khoản'),
  ('bank_name', 'Vietcombank', 'Tên ngân hàng'),
  ('buyer_count', '4', 'Số người đi mua mỗi ngày'),
  ('order_deadline_time', '11:30', 'Giờ chốt sổ đặt cơm'),
  ('low_balance_threshold', '30000', 'Ngưỡng cảnh báo số dư thấp');

-- ==========================================
-- 6. NOTIFICATION LOGS TABLE (Optional)
-- ==========================================
CREATE TABLE notification_logs (
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

CREATE INDEX idx_notif_user ON notification_logs(user_id, created_at DESC);

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON lunch_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- SEED DATA (for testing)
-- ==========================================

-- Create admin user (password: Admin123!)
-- bcrypt hash for "Admin123!": $2b$10$N9qo8uLOickgx2ZMRZoMye3uJJxjdqfCVj6J5zN1Q8JZQxg5X.Fw2
INSERT INTO users (email, password_hash, name, role, balance) VALUES
  ('admin@lunchfund.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye3uJJxjdqfCVj6J5zN1Q8JZQxg5X.Fw2', 'Admin User', 'admin', 0);

-- Create test users (password: User123!)
-- bcrypt hash for "User123!": $2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa
INSERT INTO users (email, password_hash, name, balance) VALUES
  ('user1@test.com', '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'Nguyen Van A', 100000),
  ('user2@test.com', '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'Tran Thi B', 150000),
  ('user3@test.com', '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'Le Van C', 80000),
  ('user4@test.com', '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'Pham Thi D', 200000),
  ('user5@test.com', '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'Hoang Van E', 120000);

COMMENT ON TABLE users IS 'User accounts with balance and rotation tracking';
COMMENT ON TABLE lunch_sessions IS 'Daily lunch sessions with buyer selection and settlement';
COMMENT ON TABLE transactions IS 'Financial transactions (deposit, expense, refund)';
COMMENT ON TABLE lunch_orders IS 'User orders for each lunch session';
COMMENT ON TABLE admin_settings IS 'System configuration settings';
COMMENT ON TABLE notification_logs IS 'Push notification delivery logs';
