BEGIN;

-- 1. Reimbursements table
CREATE TABLE IF NOT EXISTS reimbursements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  type VARCHAR(30) NOT NULL CHECK (type IN ('lunch_buyer', 'snack_creator')),
  related_id INTEGER NOT NULL,
  status VARCHAR(30) DEFAULT 'pending' CHECK (
    status IN ('pending', 'transferred', 'confirmed', 'disputed')
  ),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  admin_transferred_at TIMESTAMP,
  admin_transferred_by INTEGER REFERENCES users(id),
  user_confirmed_at TIMESTAMP,
  user_confirmation VARCHAR(20) CHECK (user_confirmation IN ('received', 'not_received')),
  admin_note TEXT,
  user_note TEXT
);

CREATE INDEX IF NOT EXISTS idx_reimbursements_user ON reimbursements(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reimbursements_status ON reimbursements(status, created_at DESC);

-- 2. Update lunch_sessions
ALTER TABLE lunch_sessions ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(12, 2);
ALTER TABLE lunch_sessions ADD COLUMN IF NOT EXISTS cost_per_person DECIMAL(12, 2);
ALTER TABLE lunch_sessions ADD COLUMN IF NOT EXISTS buyer_id INTEGER REFERENCES users(id);
ALTER TABLE lunch_sessions ADD COLUMN IF NOT EXISTS payment_submitted_at TIMESTAMP;
ALTER TABLE lunch_sessions ADD COLUMN IF NOT EXISTS finalized_by INTEGER REFERENCES users(id);

-- 3. Update snack_menus  
ALTER TABLE snack_menus ADD COLUMN IF NOT EXISTS total_cost DECIMAL(12, 2);
ALTER TABLE snack_menus ADD COLUMN IF NOT EXISTS finalized_by INTEGER REFERENCES users(id);
ALTER TABLE snack_menus ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMP;

-- 4. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_type TEXT,
  related_id INTEGER,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC);

COMMIT;
