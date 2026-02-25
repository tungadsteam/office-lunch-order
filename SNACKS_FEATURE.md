# 🍕 SNACKS FEATURE - Hệ thống Đặt Đồ Ăn Vặt

## 🎯 Overview

**Mở rộng tính năng** thêm hệ thống đặt đồ ăn vặt (snacks) bên cạnh hệ thống đặt cơm trưa hiện tại.

**Core Flow:**
1. Admin upload ảnh menu → Fake AI extract items + prices
2. Admin review & activate → Notify all users
3. Users order snacks (multiple items)
4. Admin finalize → Deduct balance + close session
5. Unified history (lunch + snacks)

---

## 🗄️ Database Schema

### 1. snack_menus Table

```sql
CREATE TABLE snack_menus (
  id SERIAL PRIMARY KEY,
  
  -- Metadata
  title VARCHAR(255) DEFAULT 'Menu đồ ăn vặt',
  image_url TEXT NOT NULL,
  description TEXT,
  
  -- Status workflow
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  
  -- Admin tracking
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  activated_at TIMESTAMP,
  closed_at TIMESTAMP,
  
  -- Totals (computed on finalize)
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(12, 2) DEFAULT 0.00,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_snack_menus_status ON snack_menus(status);
CREATE INDEX idx_snack_menus_created_by ON snack_menus(created_by);
CREATE INDEX idx_snack_menus_created_at ON snack_menus(created_at DESC);
```

---

### 2. snack_items Table

```sql
CREATE TABLE snack_items (
  id SERIAL PRIMARY KEY,
  menu_id INTEGER NOT NULL REFERENCES snack_menus(id) ON DELETE CASCADE,
  
  -- Item details
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
  image_url TEXT,
  description TEXT,
  
  -- Stock management (optional Phase 2)
  stock_quantity INTEGER,
  is_available BOOLEAN DEFAULT true,
  
  -- Display order
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_snack_items_menu ON snack_items(menu_id);
CREATE INDEX idx_snack_items_available ON snack_items(is_available) WHERE is_available = true;
```

---

### 3. snack_orders Table

```sql
CREATE TABLE snack_orders (
  id SERIAL PRIMARY KEY,
  menu_id INTEGER NOT NULL REFERENCES snack_menus(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES snack_items(id) ON DELETE CASCADE,
  
  -- Order details
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL, -- Snapshot price at order time
  subtotal DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * price) STORED,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  
  -- Metadata
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP,
  cancelled_at TIMESTAMP
);

CREATE INDEX idx_snack_orders_menu ON snack_orders(menu_id, status);
CREATE INDEX idx_snack_orders_user ON snack_orders(user_id, created_at DESC);
CREATE INDEX idx_snack_orders_item ON snack_orders(item_id);
CREATE INDEX idx_snack_orders_status ON snack_orders(status);

-- Prevent duplicate orders (same user + item + menu)
CREATE UNIQUE INDEX idx_snack_orders_unique 
  ON snack_orders(menu_id, user_id, item_id) 
  WHERE status = 'pending';
```

---

### 4. Extend transactions Table

**Update existing `transactions` table:**

```sql
-- Add new columns
ALTER TABLE transactions 
  ADD COLUMN transaction_type VARCHAR(30) DEFAULT 'lunch_order' 
    CHECK (transaction_type IN ('lunch_order', 'snack_order', 'deposit', 'refund', 'adjustment'));

ALTER TABLE transactions
  ADD COLUMN related_id INTEGER; -- Reference to lunch_sessions.id or snack_menus.id

-- Add index
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_related ON transactions(related_id);
```

**Migration:**

```sql
-- Migrate existing data
UPDATE transactions 
SET transaction_type = 
  CASE 
    WHEN type = 'deposit' THEN 'deposit'
    WHEN type = 'expense' AND order_id IS NOT NULL THEN 'lunch_order'
    WHEN type = 'refund' THEN 'refund'
    WHEN type = 'adjustment' THEN 'adjustment'
    ELSE 'lunch_order'
  END;

-- Populate related_id for lunch orders
UPDATE transactions 
SET related_id = order_id 
WHERE transaction_type = 'lunch_order' AND order_id IS NOT NULL;
```

---

### 5. Add Triggers

**Auto-update updated_at:**

```sql
CREATE TRIGGER update_snack_menus_updated_at
  BEFORE UPDATE ON snack_menus
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 🔌 API Endpoints

### Admin Endpoints

#### 1. POST /api/admin/snacks/upload

Upload menu image & extract items via fake AI.

**Request:**
```typescript
// Multipart form-data
FormData {
  image: File,
  title?: string,
  description?: string
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "imageUrl": "https://storage.com/menus/abc123.jpg",
    "extractedItems": [
      { "name": "Đùi gà", "price": 100000 },
      { "name": "Khoai tây chiên", "price": 50000 },
      { "name": "Pepsi", "price": 15000 }
    ]
  }
}
```

**Process:**
1. Upload image to storage (local/S3/Cloudinary)
2. Call fake AI service to extract items
3. Return image URL + extracted items
4. Frontend displays for admin review

---

#### 2. POST /api/admin/snacks/menus

Create draft menu from extracted items.

**Request:**
```json
{
  "title": "Menu đồ ăn vặt 25/02",
  "imageUrl": "https://storage.com/menus/abc123.jpg",
  "description": "Menu hôm nay",
  "items": [
    { "name": "Đùi gà", "price": 100000, "imageUrl": null },
    { "name": "Khoai tây chiên", "price": 50000 }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "menuId": 1,
    "status": "draft",
    "itemsCount": 2
  }
}
```

**Process:**
1. Create menu record (status='draft')
2. Insert items into snack_items
3. Return menu ID

---

#### 3. POST /api/admin/snacks/menus/:id/activate

Activate menu for users to order.

**Request:**
```json
{
  "notifyUsers": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Menu activated",
  "data": {
    "menuId": 1,
    "status": "active",
    "activatedAt": "2025-02-25T10:30:00Z",
    "notificationsSent": 25
  }
}
```

**Process:**
1. Update menu status = 'active'
2. Set activated_at timestamp
3. If notifyUsers=true:
   - Send push notifications to all users
   - Create in-app notification/banner
4. Broadcast via WebSocket (optional)

---

#### 4. GET /api/admin/snacks/menus/:id/orders

View all orders for a menu (for finalization).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "menu": {
      "id": 1,
      "title": "Menu đồ ăn vặt 25/02",
      "status": "active",
      "totalOrders": 15
    },
    "ordersSummary": [
      {
        "userId": 1,
        "userName": "Nguyen Van A",
        "orders": [
          { "itemName": "Đùi gà", "quantity": 2, "subtotal": 200000 },
          { "itemName": "Pepsi", "quantity": 1, "subtotal": 15000 }
        ],
        "totalCost": 215000,
        "currentBalance": 500000,
        "canPay": true
      },
      {
        "userId": 2,
        "userName": "Tran Thi B",
        "orders": [
          { "itemName": "Khoai tây chiên", "quantity": 1, "subtotal": 50000 }
        ],
        "totalCost": 50000,
        "currentBalance": 30000,
        "canPay": false
      }
    ],
    "itemsSummary": [
      { "itemName": "Đùi gà", "totalQuantity": 5, "totalRevenue": 500000 },
      { "itemName": "Khoai tây chiên", "totalQuantity": 8, "totalRevenue": 400000 }
    ],
    "grandTotal": 1500000,
    "usersCount": 15,
    "insufficientBalanceUsers": 2
  }
}
```

**Process:**
1. Get all pending orders for menu
2. Group by user
3. Calculate totals per user
4. Check balance sufficiency
5. Calculate item summaries
6. Return comprehensive overview

---

#### 5. POST /api/admin/snacks/menus/:id/finalize

Finalize orders: deduct balance, create transactions, close menu.

**Request:**
```json
{
  "skipInsufficientBalance": false
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Finalized 13/15 orders",
  "data": {
    "menuId": 1,
    "status": "closed",
    "totalProcessed": 13,
    "totalSkipped": 2,
    "totalRevenue": 1300000,
    "skippedUsers": [
      { "userId": 2, "userName": "Tran Thi B", "reason": "Insufficient balance" }
    ]
  }
}
```

**Process (Atomic Transaction):**
1. Lock all related records
2. For each user with pending orders:
   a. Calculate total cost
   b. Check balance
   c. If sufficient:
      - Deduct balance
      - Create transaction (type='snack_order', related_id=menuId)
      - Update snack_orders status='confirmed'
   d. If insufficient & skipInsufficientBalance=true:
      - Update snack_orders status='cancelled'
      - Log skipped user
3. Update menu:
   - status='closed'
   - total_orders, total_revenue
   - closed_at timestamp
4. Commit transaction
5. Send notifications to users (order confirmed/failed)

**Error Handling:**
- If any error → Rollback entire transaction
- Return detailed error with affected users

---

#### 6. GET /api/admin/snacks/menus

List all menus (with filters).

**Query params:**
- `status` (draft | active | closed | all)
- `limit` (default: 30)
- `offset` (default: 0)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "menus": [
      {
        "id": 1,
        "title": "Menu 25/02",
        "status": "closed",
        "totalOrders": 15,
        "totalRevenue": 1500000,
        "createdAt": "2025-02-25T09:00:00Z",
        "closedAt": "2025-02-25T15:00:00Z"
      }
    ],
    "total": 10,
    "limit": 30,
    "offset": 0
  }
}
```

---

### User Endpoints

#### 7. GET /api/snacks/menus/active

Get currently active menu.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "menu": {
      "id": 1,
      "title": "Menu đồ ăn vặt 25/02",
      "imageUrl": "https://storage.com/menus/abc123.jpg",
      "description": "Menu hôm nay",
      "status": "active",
      "activatedAt": "2025-02-25T10:30:00Z"
    },
    "items": [
      {
        "id": 1,
        "name": "Đùi gà",
        "price": 100000,
        "imageUrl": null,
        "isAvailable": true
      },
      {
        "id": 2,
        "name": "Khoai tây chiên",
        "price": 50000,
        "isAvailable": true
      }
    ],
    "myOrders": [
      {
        "id": 10,
        "itemId": 1,
        "itemName": "Đùi gà",
        "quantity": 2,
        "subtotal": 200000
      }
    ],
    "myTotal": 200000
  }
}
```

**Response (404) if no active menu:**
```json
{
  "success": false,
  "message": "No active menu"
}
```

---

#### 8. POST /api/snacks/orders

Place order (multiple items).

**Request:**
```json
{
  "menuId": 1,
  "items": [
    { "itemId": 1, "quantity": 2 },
    { "itemId": 3, "quantity": 1 }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "orderId": [10, 11],
    "totalCost": 215000,
    "remainingBalance": 284000
  }
}
```

**Process:**
1. Validate menu is active
2. Validate all items exist & available
3. Calculate total cost
4. Check user balance >= total
5. Insert orders (one row per item)
6. Return order IDs + totals

**Errors:**
- Menu not active → 400
- Item not found → 404
- Insufficient balance → 400
- Already ordered same item → 409 (update quantity instead)

---

#### 9. GET /api/snacks/orders/my

Get own snack orders.

**Query params:**
- `menuId` (optional, filter by menu)
- `status` (pending | confirmed | cancelled | all)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "menuId": 1,
      "menuTitle": "Menu 25/02",
      "status": "pending",
      "orders": [
        {
          "id": 10,
          "itemName": "Đùi gà",
          "quantity": 2,
          "price": 100000,
          "subtotal": 200000
        }
      ],
      "totalCost": 200000,
      "createdAt": "2025-02-25T11:00:00Z"
    }
  ]
}
```

---

#### 10. PUT /api/snacks/orders/:id

Update order quantity (before finalize).

**Request:**
```json
{
  "quantity": 3
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Order updated",
  "data": {
    "orderId": 10,
    "newQuantity": 3,
    "newSubtotal": 300000
  }
}
```

**Validation:**
- Order must be pending
- Menu must be active
- Check balance for new total

---

#### 11. DELETE /api/snacks/orders/:id

Cancel order (before finalize).

**Response (200):**
```json
{
  "success": true,
  "message": "Order cancelled"
}
```

**Process:**
1. Check order status = 'pending'
2. Update status = 'cancelled'
3. Set cancelled_at timestamp

---

### Unified History Endpoint

#### 12. GET /api/orders/history (Extended)

Get unified history (lunch + snacks).

**Query params:**
- `type` (all | lunch | snacks) - NEW
- `limit` (default: 30)
- `offset` (default: 0)
- `startDate`, `endDate`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 50,
        "type": "lunch",
        "date": "2025-02-24",
        "status": "settled",
        "totalParticipants": 15,
        "myCost": 33333,
        "details": null
      },
      {
        "id": 1,
        "type": "snack",
        "date": "2025-02-25",
        "menuTitle": "Menu 25/02",
        "status": "confirmed",
        "items": [
          { "name": "Đùi gà", "quantity": 2, "subtotal": 200000 }
        ],
        "myCost": 200000
      }
    ],
    "summary": {
      "totalLunchOrders": 15,
      "totalSnackOrders": 3,
      "totalSpent": 550000
    },
    "total": 18,
    "limit": 30,
    "offset": 0
  }
}
```

---

## 🤖 Fake AI Service

### Implementation

**Endpoint:** `POST /api/ai/extract-menu`

**Mock Logic:**

```typescript
// backend/src/services/FakeAIService.js

const SAMPLE_ITEMS = [
  { name: 'Đùi gà', priceRange: [80000, 120000] },
  { name: 'Cánh gà chiên', priceRange: [60000, 90000] },
  { name: 'Khoai tây chiên', priceRange: [30000, 60000] },
  { name: 'Nem chua rán', priceRange: [40000, 70000] },
  { name: 'Bánh tráng trộn', priceRange: [25000, 45000] },
  { name: 'Xúc xích', priceRange: [20000, 40000] },
  { name: 'Pepsi', priceRange: [10000, 20000] },
  { name: 'Coca Cola', priceRange: [10000, 20000] },
  { name: 'Trà sữa', priceRange: [20000, 40000] },
  { name: 'Nước cam', priceRange: [15000, 25000] },
  { name: 'Bánh mì', priceRange: [20000, 35000] },
  { name: 'Há cảo', priceRange: [30000, 50000] },
];

class FakeAIService {
  static async extractMenuItems(imageUrl) {
    // Simulate API delay
    await sleep(1500);
    
    // Random number of items (3-8)
    const numItems = Math.floor(Math.random() * 6) + 3;
    
    // Randomly select items
    const shuffled = SAMPLE_ITEMS.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, numItems);
    
    // Generate random prices within range
    const items = selected.map(item => ({
      name: item.name,
      price: randomInRange(item.priceRange[0], item.priceRange[1])
    }));
    
    return items;
  }
}

function randomInRange(min, max) {
  const range = max - min;
  const random = Math.floor(Math.random() * (range / 1000)) * 1000 + min;
  return random;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = FakeAIService;
```

**Real AI Integration (Phase 2 Optional):**
- Use Google Vision API / AWS Rekognition
- OCR text from image
- Parse text → extract items + prices
- Return structured data

---

## 🎨 Frontend Design

### Admin Pages

#### 1. Upload Menu Page (`/admin/snacks/upload`)

**Layout:**
```
┌─────────────────────────────────────┐
│ ←  Upload Menu Đồ Ăn Vặt            │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────────────┐  │
│  │  📸 Drop image here          │  │
│  │  or click to browse          │  │
│  │                              │  │
│  │  [Image preview if uploaded] │  │
│  └──────────────────────────────┘  │
│                                     │
│  Title (optional):                  │
│  ┌────────────────────────────┐    │
│  │ Menu 25/02                 │    │
│  └────────────────────────────┘    │
│                                     │
│  [ Upload & Extract ]               │
│                                     │
│  ⏳ Extracting items... (if loading)│
│                                     │
│  ✅ Items extracted!                │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ Editable Table:              │  │
│  │ Name          | Price   | [X]│  │
│  │ Đùi gà        | 100,000 | [X]│  │
│  │ Khoai tây     | 50,000  | [X]│  │
│  │ [ Add item ]                │  │
│  └──────────────────────────────┘  │
│                                     │
│  [ Cancel ] [ Activate Menu ]       │
│                                     │
└─────────────────────────────────────┘
```

**Features:**
- Drag-and-drop image upload
- Image preview
- Loading spinner during AI extraction
- Editable table (add/remove/edit items)
- Validation (name required, price > 0)
- "Activate Menu" → Sends notifications

**Flow:**
1. User uploads image → POST /api/admin/snacks/upload
2. Backend extracts items → Returns list
3. Admin reviews/edits items
4. Admin clicks "Activate" → POST /api/admin/snacks/menus + activate

---

#### 2. Manage Snack Orders Page (`/admin/snacks/menus/:id/orders`)

**Layout:**
```
┌─────────────────────────────────────┐
│ ←  Đơn Đặt Hàng - Menu 25/02        │
├─────────────────────────────────────┤
│  Status: 🟢 Active                  │
│  Total orders: 15 users             │
│  Total revenue: 1,500,000đ          │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ 📊 Items Summary             │  │
│  │ Đùi gà: 5 x 100k = 500k      │  │
│  │ Khoai tây: 8 x 50k = 400k    │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ 👥 Orders by User            │  │
│  │                              │  │
│  │ Nguyen Van A                 │  │
│  │ • Đùi gà x2: 200k            │  │
│  │ • Pepsi x1: 15k              │  │
│  │ Total: 215k | Balance: 500k  │  │
│  │ ✅ Can pay                    │  │
│  │                              │  │
│  │ Tran Thi B                   │  │
│  │ • Khoai tây x1: 50k          │  │
│  │ Total: 50k | Balance: 30k    │  │
│  │ ⚠️ Insufficient balance       │  │
│  │                              │  │
│  └──────────────────────────────┘  │
│                                     │
│  ⚠️ 2 users with insufficient funds │
│                                     │
│  [ Cancel Orders ] [ Finalize ]     │
│                                     │
└─────────────────────────────────────┘
```

**Features:**
- Summary stats (total orders, revenue)
- Items summary (quantity + revenue per item)
- List of users with their orders
- Balance check indicator
- Warning for insufficient balance users
- "Finalize" button with confirmation dialog

**Finalize Dialog:**
```
⚠️ Xác nhận quyết toán?

- 13/15 users sẽ được trừ tiền
- 2 users sẽ bị hủy (không đủ tiền)
- Tổng tiền thu: 1,300,000đ

[ Cancel ] [ Confirm ]
```

---

#### 3. Snack Menus List (`/admin/snacks/menus`)

**Table:**
- Date, Title, Status, Total Orders, Revenue, Actions
- Filter by status
- Click row → View orders

---

### User Pages

#### 1. Snack Menu Page (`/snacks/menu`)

**Layout (Desktop):**
```
┌─────────────────────────────────────┐
│ 🍕 Menu Đồ Ăn Vặt - 25/02           │
├─────────────────────────────────────┤
│  [Menu Image]                       │
│                                     │
│  ┌─────────┐ ┌─────────┐ ┌───────┐│
│  │ [📸]    │ │ [📸]    │ │ [📸]  ││
│  │ Đùi gà  │ │ Khoai   │ │ Pepsi ││
│  │ 100,000đ│ │ 50,000đ │ │ 15k   ││
│  │ [1 ▼]   │ │ [1 ▼]   │ │ [1 ▼] ││
│  │ [+Cart] │ │ [+Cart] │ │ [Add] ││
│  └─────────┘ └─────────┘ └───────┘│
│                                     │
│  (More items...)                    │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ 🛒 Giỏ hàng                  │  │
│  │ • Đùi gà x2: 200k            │  │
│  │ • Pepsi x1: 15k              │  │
│  │ Tổng: 215,000đ               │  │
│  │ Số dư: 500,000đ              │  │
│  │ Còn lại: 285,000đ            │  │
│  │                              │  │
│  │ [ Đặt hàng ]                 │  │
│  └──────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

**Layout (Mobile):**
- Grid 2 columns
- Sticky cart summary at bottom
- Bottom sheet for cart details

**Features:**
- Item cards with image (if available)
- Quantity selector (dropdown or +/- buttons)
- "Add to Cart" button per item
- Cart summary (floating or sidebar)
- Balance check
- "Place Order" button (disabled if insufficient balance)

**Cart Behavior:**
- Add item → Update cart
- Change quantity → Update total
- Remove item → Update cart
- Click "Place Order" → Confirm dialog → Submit

**Order Confirmation Dialog:**
```
Xác nhận đặt hàng?

• Đùi gà x2: 200,000đ
• Pepsi x1: 15,000đ

Tổng: 215,000đ
Số dư còn lại: 285,000đ

[ Hủy ] [ Xác nhận ]
```

---

#### 2. My Snack Orders Page (`/snacks/orders`)

**Layout:**
```
┌─────────────────────────────────────┐
│ ←  Đơn Hàng Của Tôi                 │
├─────────────────────────────────────┤
│  ┌──────────────────────────────┐  │
│  │ Menu 25/02                   │  │
│  │ Status: ⏳ Đang chờ          │  │
│  │                              │  │
│  │ • Đùi gà x2: 200,000đ        │  │
│  │ • Pepsi x1: 15,000đ          │  │
│  │                              │  │
│  │ Tổng: 215,000đ               │  │
│  │ Ngày đặt: 25/02 11:00        │  │
│  │                              │  │
│  │ [ Sửa ] [ Hủy đơn ]          │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ Menu 24/02                   │  │
│  │ Status: ✅ Đã thanh toán     │  │
│  │ • Khoai tây x1: 50,000đ      │  │
│  │ Ngày đặt: 24/02              │  │
│  └──────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

**Features:**
- List orders grouped by menu
- Status badge (pending/confirmed/cancelled)
- Show items + quantities + costs
- "Edit" button (if pending & menu active)
- "Cancel Order" button (if pending)
- Expandable details

---

### Updated Pages

#### Dashboard (`/`)

**Add Snack Banner:**
```
┌─────────────────────────────────────┐
│ Dashboard                           │
├─────────────────────────────────────┤
│  ⚡ Banner (if active menu):        │
│  ┌──────────────────────────────┐  │
│  │ 🍕 Menu đồ ăn vặt đang mở!   │  │
│  │ Đặt ngay → [Xem menu]        │  │
│  └──────────────────────────────┘  │
│                                     │
│  (Existing dashboard content...)    │
└─────────────────────────────────────┘
```

---

#### History Page (`/history`)

**Add Filter:**
```
┌─────────────────────────────────────┐
│ Lịch Sử                             │
├─────────────────────────────────────┤
│  Filter: [All ▼] [Lunch] [Snacks]  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ 🍕 Menu 25/02 - Snacks       │  │
│  │ • Đùi gà x2: 200k            │  │
│  │ Status: ✅ Đã thanh toán     │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ 🍱 Cơm 24/02 - Lunch         │  │
│  │ 15 người • 33,333đ           │  │
│  │ Status: ✅                   │  │
│  └──────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

**Features:**
- Filter dropdown (All/Lunch/Snacks)
- Type icon (🍱 or 🍕)
- Expandable details for snacks (list items)
- Color coding

---

## 🧠 State Management

### Zustand Store

```typescript
// lib/store/snackStore.ts
import { create } from 'zustand';
import { snacksService } from '../api/services/snacks';

interface SnackItem {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
}

interface CartItem {
  itemId: number;
  quantity: number;
}

interface SnackState {
  activeMenu: any | null;
  items: SnackItem[];
  cart: CartItem[];
  
  // Actions
  fetchActiveMenu: () => Promise<void>;
  addToCart: (itemId: number, quantity: number) => void;
  removeFromCart: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  clearCart: () => void;
  placeOrder: () => Promise<void>;
  
  // Computed
  cartTotal: () => number;
}

export const useSnackStore = create<SnackState>((set, get) => ({
  activeMenu: null,
  items: [],
  cart: [],
  
  fetchActiveMenu: async () => {
    const response = await snacksService.getActiveMenu();
    set({
      activeMenu: response.data.menu,
      items: response.data.items,
    });
  },
  
  addToCart: (itemId, quantity) => {
    const { cart, items } = get();
    const existing = cart.find(c => c.itemId === itemId);
    
    if (existing) {
      set({
        cart: cart.map(c => 
          c.itemId === itemId 
            ? { ...c, quantity: c.quantity + quantity }
            : c
        ),
      });
    } else {
      set({ cart: [...cart, { itemId, quantity }] });
    }
  },
  
  removeFromCart: (itemId) => {
    set({ cart: get().cart.filter(c => c.itemId !== itemId) });
  },
  
  updateQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(itemId);
    } else {
      set({
        cart: get().cart.map(c =>
          c.itemId === itemId ? { ...c, quantity } : c
        ),
      });
    }
  },
  
  clearCart: () => {
    set({ cart: [] });
  },
  
  placeOrder: async () => {
    const { activeMenu, cart } = get();
    const items = cart.map(c => ({ itemId: c.itemId, quantity: c.quantity }));
    
    await snacksService.placeOrder(activeMenu.id, items);
    get().clearCart();
    await get().fetchActiveMenu(); // Refresh to show current orders
  },
  
  cartTotal: () => {
    const { cart, items } = get();
    return cart.reduce((sum, c) => {
      const item = items.find(i => i.id === c.itemId);
      return sum + (item ? item.price * c.quantity : 0);
    }, 0);
  },
}));
```

---

## 🔔 Notification System

### Push Notifications

**When Admin Activates Menu:**

```typescript
// backend/src/services/NotificationService.js

async function notifyMenuActivated(menuId) {
  const users = await User.findAll({
    where: { is_active: true, notification_enabled: true }
  });
  
  const promises = users.map(user => 
    sendPushNotification(
      user.id,
      '🍕 Menu đồ ăn vặt mới!',
      'Xem và đặt hàng ngay',
      {
        type: 'snack_menu_activated',
        menuId: menuId,
        action: '/snacks/menu'
      }
    )
  );
  
  await Promise.all(promises);
}
```

**When Order Confirmed:**

```typescript
async function notifyOrderConfirmed(userId, menuTitle, totalCost) {
  await sendPushNotification(
    userId,
    '✅ Đơn hàng đã được xác nhận',
    `${menuTitle} - Đã trừ ${formatCurrency(totalCost)}`,
    {
      type: 'snack_order_confirmed',
      action: '/snacks/orders'
    }
  );
}
```

**When Order Cancelled (Insufficient Balance):**

```typescript
async function notifyOrderCancelled(userId, menuTitle, reason) {
  await sendPushNotification(
    userId,
    '❌ Đơn hàng bị hủy',
    `${menuTitle} - ${reason}`,
    {
      type: 'snack_order_cancelled',
      action: '/balance'
    }
  );
}
```

---

### In-app Banner

**Dashboard Banner Component:**

```typescript
// components/dashboard/SnackBanner.tsx
import { useEffect, useState } from 'react';
import { snacksService } from '@/lib/api/services/snacks';
import Link from 'next/link';

export function SnackBanner() {
  const [hasActiveMenu, setHasActiveMenu] = useState(false);
  
  useEffect(() => {
    checkActiveMenu();
  }, []);
  
  async function checkActiveMenu() {
    try {
      await snacksService.getActiveMenu();
      setHasActiveMenu(true);
    } catch (error) {
      setHasActiveMenu(false);
    }
  }
  
  if (!hasActiveMenu) return null;
  
  return (
    <Link href="/snacks/menu">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-lg text-white cursor-pointer hover:shadow-lg transition">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold">🍕 Menu đồ ăn vặt đang mở!</p>
            <p className="text-sm">Đặt ngay để không bỏ lỡ</p>
          </div>
          <span className="text-2xl">→</span>
        </div>
      </div>
    </Link>
  );
}
```

---

## 🚀 Implementation Plan

### Phase 1: Backend (6-8 hours)

**Step 1: Database (1h)**
- Create migrations
- Add tables: snack_menus, snack_items, snack_orders
- Extend transactions table
- Add indexes & triggers

**Step 2: Fake AI Service (1h)**
- Implement FakeAIService.js
- Random item generation
- Test endpoint

**Step 3: Admin APIs (2-3h)**
- Upload & extract endpoint
- Create menu endpoint
- Activate menu endpoint
- Get orders summary endpoint
- Finalize orders endpoint (complex, atomic transaction)

**Step 4: User APIs (1-2h)**
- Get active menu endpoint
- Place order endpoint
- Get my orders endpoint
- Update/cancel order endpoints

**Step 5: History Extension (1h)**
- Extend GET /api/orders/history
- Add type filter
- Merge lunch + snacks
- Test

---

### Phase 2: Frontend - Admin (4-6 hours)

**Step 6: Upload Page (2-3h)**
- Image upload component (drag-and-drop)
- Call upload & extract API
- Editable items table
- Activate menu flow

**Step 7: Manage Orders Page (2-3h)**
- Fetch orders summary
- Display users & items
- Balance check indicators
- Finalize confirmation dialog
- Handle finalization

---

### Phase 3: Frontend - User (4-6 hours)

**Step 8: Snack Menu Page (2-3h)**
- Fetch active menu
- Grid layout for items
- Cart functionality (add/remove/update)
- Cart summary component
- Place order flow

**Step 9: My Orders Page (1-2h)**
- List own orders
- Status badges
- Edit/cancel actions

**Step 10: Dashboard Banner (1h)**
- Check active menu
- Display banner
- Link to menu

---

### Phase 4: Integration & Testing (2-3 hours)

**Step 11: History Integration (1h)**
- Add type filter
- Display both lunch & snacks
- Test filter logic

**Step 12: Notifications (1h)**
- Test push notifications
- Test in-app banner

**Step 13: Testing (1h)**
- Full flow test (admin → user → finalize)
- Edge cases (insufficient balance, cancel orders)
- Bug fixes

---

## ✅ Acceptance Criteria

**Must Have:**
- [ ] Admin can upload image & extract items
- [ ] Admin can activate menu → users notified
- [ ] Users can view active menu
- [ ] Users can place orders (multiple items)
- [ ] Users can view/edit/cancel pending orders
- [ ] Admin can view orders summary
- [ ] Admin can finalize → balance deducted
- [ ] Unified history shows lunch + snacks
- [ ] Notifications work (push + in-app banner)

**Nice to Have:**
- [ ] Real AI integration (Google Vision)
- [ ] Stock management (track available quantity)
- [ ] Item images
- [ ] Order deadline (time limit)

---

## 🔒 Security & Validation

**Backend:**
- Validate menu status before operations
- Check balance before placing order
- Atomic transaction for finalization
- Prevent race conditions (locks)
- Authorize admin-only endpoints

**Frontend:**
- Validate quantities > 0
- Check balance client-side (UX)
- Confirm dialogs for critical actions
- Error handling & user feedback

---

## 📊 Database Migration

```sql
-- Migration: Add snacks feature

-- Step 1: Create tables
CREATE TABLE snack_menus (...);
CREATE TABLE snack_items (...);
CREATE TABLE snack_orders (...);

-- Step 2: Extend transactions
ALTER TABLE transactions ADD COLUMN transaction_type VARCHAR(30);
ALTER TABLE transactions ADD COLUMN related_id INTEGER;

-- Step 3: Migrate existing data
UPDATE transactions SET transaction_type = ...;

-- Step 4: Add indexes
CREATE INDEX idx_snack_menus_status ON snack_menus(status);
...

-- Step 5: Add triggers
CREATE TRIGGER update_snack_menus_updated_at ...;
```

**Rollback:**
```sql
DROP TABLE snack_orders;
DROP TABLE snack_items;
DROP TABLE snack_menus;
ALTER TABLE transactions DROP COLUMN transaction_type;
ALTER TABLE transactions DROP COLUMN related_id;
```

---

## 📝 API Testing (Postman Collection)

**Admin Flow:**
1. Upload image → Extract items
2. Create menu
3. Activate menu
4. View orders
5. Finalize orders

**User Flow:**
1. Get active menu
2. Place order
3. View my orders
4. Update quantity
5. Cancel order

**History:**
1. Get history (all)
2. Get history (snacks only)

---

## ✅ Done!

Snacks Feature architecture hoàn chỉnh! Key points:

1. ✅ **Database Schema:** 3 new tables + extend transactions
2. ✅ **12 API Endpoints:** Admin (6) + User (5) + History (1 extended)
3. ✅ **Fake AI Service:** Random item extraction
4. ✅ **Frontend Pages:** Upload, Orders, Menu, My Orders, History
5. ✅ **State Management:** Zustand store for cart
6. ✅ **Notifications:** Push + in-app banner
7. ✅ **Business Logic:** Atomic finalization with balance checks
8. ✅ **Implementation Plan:** 16-23 hours (4 phases)

---

**Timeline:** 16-23 giờ
- Phase 1 (Backend): 6-8h
- Phase 2 (Admin Frontend): 4-6h
- Phase 3 (User Frontend): 4-6h
- Phase 4 (Integration): 2-3h

**Next Steps:**
1. Commit & push this document
2. Review với PM
3. Giao task chi tiết cho Coder

🚀 **READY TO IMPLEMENT!**
