-- Snack Menus Table
CREATE TABLE IF NOT EXISTS snack_menus (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) DEFAULT 'Menu đồ ăn vặt',
  image_url TEXT,
  description TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  activated_at TIMESTAMP,
  closed_at TIMESTAMP,
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(12, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_snack_menus_status ON snack_menus(status);
CREATE INDEX IF NOT EXISTS idx_snack_menus_created_at ON snack_menus(created_at DESC);

-- Snack Items Table
CREATE TABLE IF NOT EXISTS snack_items (
  id SERIAL PRIMARY KEY,
  menu_id INTEGER NOT NULL REFERENCES snack_menus(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
  image_url TEXT,
  description TEXT,
  is_available BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_snack_items_menu ON snack_items(menu_id);

-- Snack Orders Table
CREATE TABLE IF NOT EXISTS snack_orders (
  id SERIAL PRIMARY KEY,
  menu_id INTEGER NOT NULL REFERENCES snack_menus(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES snack_items(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP,
  cancelled_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_snack_orders_menu ON snack_orders(menu_id, status);
CREATE INDEX IF NOT EXISTS idx_snack_orders_user ON snack_orders(user_id);

-- Prevent duplicate orders (same user + item + menu when pending)
CREATE UNIQUE INDEX IF NOT EXISTS idx_snack_orders_unique 
  ON snack_orders(menu_id, user_id, item_id) WHERE status = 'pending';

-- Trigger for updated_at
CREATE TRIGGER update_snack_menus_updated_at
  BEFORE UPDATE ON snack_menus
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
