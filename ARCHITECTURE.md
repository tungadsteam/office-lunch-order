# 🏗️ ARCHITECTURE - Lunch Fund Management System

## 📋 Tổng quan

Hệ thống quản lý quỹ cơm trưa tập thể với 3 core features:
1. **Quản lý quỹ nội bộ** (balance management + deposit approval)
2. **Rotation algorithm** (chọn 4 người đi mua, không trùng hôm trước)
3. **Auto-settlement** (chia bill tự động cho tất cả người đặt)

**Tech Stack:**
- **Mobile:** React Native (iOS)
- **Backend:** Node.js (v18+) + Express.js
- **Database:** PostgreSQL 15+
- **Real-time:** WebSocket (Socket.io)
- **Push Notifications:** Firebase Cloud Messaging (FCM) / APNs
- **Authentication:** JWT
- **Deployment:** Docker + Docker Compose

---

## 🗄️ Database Schema

### 1. Users Table

```sql
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
```

### 2. Transactions Table

```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Transaction type
  type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'expense', 'refund', 'adjustment')),
  amount DECIMAL(12, 2) NOT NULL,
  
  -- Deposit workflow
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_id INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  
  -- Linking
  order_id INTEGER REFERENCES lunch_sessions(id),
  
  -- Details
  note TEXT,
  metadata JSONB, -- Extra data like: { bank_ref, image_url, etc }
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_user ON transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status) WHERE status = 'pending';
CREATE INDEX idx_transactions_order ON transactions(order_id);
```

### 3. Lunch Sessions Table

```sql
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
```

### 4. Lunch Orders Table

```sql
CREATE TABLE lunch_orders (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES lunch_sessions(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cancelled_at TIMESTAMP,
  
  UNIQUE(session_id, user_id) -- Mỗi user chỉ đặt 1 lần/ngày
);

CREATE INDEX idx_orders_session ON lunch_orders(session_id, status);
CREATE INDEX idx_orders_user ON lunch_orders(user_id, created_at DESC);
```

### 5. Admin Settings Table

```sql
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
```

### 6. Notification Logs Table (Optional - for debugging)

```sql
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
```

---

## 🔐 Database Triggers & Functions

### Auto-update `updated_at` timestamp

```sql
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

CREATE TRIGGER update_lunch_sessions_updated_at
  BEFORE UPDATE ON lunch_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Validate balance không âm

```sql
-- Constraint đã có trong CREATE TABLE
-- Thêm trigger để double-check:
CREATE OR REPLACE FUNCTION check_balance_non_negative()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.balance < 0 THEN
    RAISE EXCEPTION 'Balance cannot be negative for user_id: %', NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_user_balance
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION check_balance_non_negative();
```

---

## 🏛️ Backend Architecture

```
office-lunch-order/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js          # PostgreSQL connection (pg-pool)
│   │   │   ├── env.js               # Environment variables
│   │   │   ├── constants.js         # App constants
│   │   │   └── firebase.js          # FCM initialization
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT verify middleware
│   │   │   ├── admin.js             # Check admin role
│   │   │   ├── errorHandler.js      # Global error handler
│   │   │   ├── validator.js         # Request validation (express-validator)
│   │   │   └── rateLimiter.js       # Rate limiting (express-rate-limit)
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── users.routes.js
│   │   │   ├── transactions.routes.js
│   │   │   ├── orders.routes.js
│   │   │   ├── admin.routes.js
│   │   │   └── index.js             # Route aggregator
│   │   │
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── users.controller.js
│   │   │   ├── transactions.controller.js
│   │   │   ├── orders.controller.js
│   │   │   └── admin.controller.js
│   │   │
│   │   ├── services/                # ⭐ BUSINESS LOGIC CORE
│   │   │   ├── UserService.js
│   │   │   ├── TransactionService.js
│   │   │   ├── LunchSessionService.js
│   │   │   ├── BuyerSelectionService.js   # ⚠️ CRITICAL
│   │   │   ├── SettlementService.js       # ⚠️ CRITICAL
│   │   │   ├── NotificationService.js
│   │   │   └── AdminService.js
│   │   │
│   │   ├── models/                  # Database access layer
│   │   │   ├── User.js
│   │   │   ├── Transaction.js
│   │   │   ├── LunchSession.js
│   │   │   ├── LunchOrder.js
│   │   │   └── AdminSetting.js
│   │   │
│   │   ├── utils/
│   │   │   ├── jwt.js               # Generate/verify JWT
│   │   │   ├── bcrypt.js            # Password hashing
│   │   │   ├── logger.js            # Winston logger
│   │   │   ├── asyncHandler.js      # Wrap async routes
│   │   │   └── validators.js        # Custom validation helpers
│   │   │
│   │   ├── websocket/
│   │   │   ├── socket.js            # Socket.io setup
│   │   │   └── handlers.js          # Real-time event handlers
│   │   │
│   │   ├── jobs/                    # Scheduled tasks
│   │   │   ├── dailyReminder.js     # 8:30 AM reminder
│   │   │   ├── selectBuyers.js      # 11:30 AM select 4 buyers
│   │   │   └── scheduler.js         # node-cron setup
│   │   │
│   │   └── app.js                   # Express app initialization
│   │
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── buyerSelection.test.js
│   │   │   └── settlement.test.js
│   │   ├── integration/
│   │   │   └── api.test.js
│   │   └── setup.js
│   │
│   ├── .env.example
│   ├── .env.test
│   ├── package.json
│   ├── Dockerfile
│   └── server.js                    # Entry point
│
├── mobile/                          # React Native (iOS)
│   └── ... (mobile app code)
│
├── docker-compose.yml
├── BRIEF.md
├── ARCHITECTURE.md                  # This file
└── README.md
```

---

## 🔌 API Contract

### Base URL
```
Development: http://localhost:3000/api
Production: https://api.lunch-fund.com/api
```

### Authentication
All protected routes require JWT token in header:
```
Authorization: Bearer <jwt_token>
```

---

### 🔐 Auth Endpoints

#### 1. POST /auth/register

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "Nguyen Van A",
  "phone": "0901234567"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "Nguyen Van A",
      "role": "user",
      "balance": 0
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errors:**
- 400: Email already exists
- 422: Validation error (weak password, invalid email...)

---

#### 2. POST /auth/login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "fcm_token": "dGVzdF90b2tlbl9mcm9tX2ZpcmViYXNl" // Optional
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "Nguyen Van A",
      "role": "user",
      "balance": 150000
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errors:**
- 401: Invalid credentials
- 403: Account disabled

---

#### 3. GET /auth/me

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "Nguyen Van A",
    "role": "user",
    "balance": 150000,
    "rotation_index": 3,
    "total_bought_times": 12,
    "last_bought_date": "2025-02-20"
  }
}
```

---

### 💰 Transaction Endpoints

#### 4. POST /transactions/deposit

User gửi yêu cầu nạp tiền.

**Request:**
```json
{
  "amount": 500000,
  "note": "Nạp tiền tháng 2",
  "bank_reference": "FT25022401234567" // Optional
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 42,
    "user_id": 1,
    "type": "deposit",
    "amount": 500000,
    "status": "pending",
    "note": "Nạp tiền tháng 2",
    "created_at": "2025-02-24T10:30:00Z"
  }
}
```

---

#### 5. GET /transactions/pending

**[Admin only]**

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 42,
      "user": {
        "id": 1,
        "name": "Nguyen Van A",
        "email": "user@example.com"
      },
      "amount": 500000,
      "note": "Nạp tiền tháng 2",
      "created_at": "2025-02-24T10:30:00Z"
    }
  ]
}
```

---

#### 6. PUT /transactions/:id/approve

**[Admin only]**

**Request:**
```json
{
  "note": "Đã xác nhận chuyển khoản" // Optional
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Deposit approved successfully",
  "data": {
    "transaction_id": 42,
    "user_id": 1,
    "new_balance": 650000
  }
}
```

**Side effects:**
- Cộng tiền vào `users.balance`
- Update transaction `status = 'approved'`
- Gửi push notification cho user

---

#### 7. GET /transactions/history

**Query params:**
- `limit` (default: 50)
- `offset` (default: 0)
- `type` (filter: deposit | expense | refund)
- `start_date` (ISO format)
- `end_date` (ISO format)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": 100,
        "type": "expense",
        "amount": -33333,
        "note": "Cơm 24/02/2025 - 15 người",
        "created_at": "2025-02-24T13:00:00Z",
        "order_id": 50
      },
      {
        "id": 99,
        "type": "deposit",
        "amount": 500000,
        "status": "approved",
        "note": "Nạp tiền tháng 2",
        "created_at": "2025-02-24T10:30:00Z"
      }
    ],
    "total": 127,
    "limit": 50,
    "offset": 0
  }
}
```

---

### 🍱 Order Endpoints

#### 8. GET /orders/today

Lấy thông tin đơn hàng hôm nay.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": 50,
      "session_date": "2025-02-24",
      "status": "buyers_selected",
      "total_participants": 15,
      "buyer_ids": [1, 5, 8, 12],
      "buyers": [
        { "id": 1, "name": "Nguyen Van A" },
        { "id": 5, "name": "Tran Thi B" },
        { "id": 8, "name": "Le Van C" },
        { "id": 12, "name": "Pham Thi D" }
      ]
    },
    "participants": [
      { "id": 1, "name": "Nguyen Van A", "is_buyer": true },
      { "id": 2, "name": "User 2", "is_buyer": false },
      // ... 15 people
    ],
    "current_user_ordered": true,
    "deadline": "11:30"
  }
}
```

---

#### 9. POST /orders/today/join

User đặt cơm hôm nay.

**Request:** (empty body or optional note)
```json
{
  "note": "Thêm rau"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Đã đặt cơm thành công",
  "data": {
    "order_id": 123,
    "session_id": 50,
    "user_id": 2
  }
}
```

**Errors:**
- 400: Already ordered today
- 400: Low balance (< 30,000đ)
- 400: Session already settled

**Side effects:**
- Insert into `lunch_orders`
- Update `lunch_sessions.total_participants`
- Broadcast real-time event via WebSocket

---

#### 10. DELETE /orders/today/leave

User hủy đặt cơm.

**Response (200):**
```json
{
  "success": true,
  "message": "Đã hủy đặt cơm"
}
```

**Errors:**
- 400: Not ordered today
- 400: Cannot cancel after buyers selected

---

#### 11. POST /orders/today/select-buyers

**[System/Admin]** Chọn 4 người đi mua.

Thường được gọi tự động bởi cron job lúc 11:30 AM.

**Request (optional):**
```json
{
  "force": false // true = bỏ qua check thời gian
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "session_id": 50,
    "buyers": [
      { "id": 1, "name": "Nguyen Van A", "rotation_index": 0 },
      { "id": 5, "name": "Tran Thi B", "rotation_index": 1 },
      { "id": 8, "name": "Le Van C", "rotation_index": 2 },
      { "id": 12, "name": "Pham Thi D", "rotation_index": 3 }
    ],
    "algorithm": "rotation_no_repeat",
    "yesterday_buyers": [2, 3, 7, 9]
  }
}
```

**Side effects:**
- Update `lunch_sessions.buyer_ids`, `status = 'buyers_selected'`
- Update `users.rotation_index` cho 4 người được chọn
- Gửi push notification cho 4 người

---

#### 12. POST /orders/today/payment

1 trong 4 người đi mua nhập hóa đơn.

**Request:**
```json
{
  "total_bill": 500000,
  "bill_image_url": "https://storage.com/invoice.jpg", // Optional
  "note": "Quán Cơm Tấm 37" // Optional
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Đã quyết toán thành công",
  "data": {
    "session_id": 50,
    "total_bill": 500000,
    "participants": 15,
    "amount_per_person": 33333.33,
    "payer_id": 1,
    "payer_credited": 500000,
    "settlement_summary": {
      "total_debited": 500000,
      "payer_net_change": 466667 // +500k - 33k
    }
  }
}
```

**Errors:**
- 403: Only selected buyers can submit payment
- 400: Payment already submitted
- 400: Invalid amount (< 0)

**Side effects:**
- Atomic transaction:
  - `users.balance` → +500k cho payer
  - `users.balance` → -33k cho tất cả 15 người (bao gồm cả payer)
  - Insert 16 transactions (1 credit + 15 debits)
  - Update `lunch_sessions.status = 'settled'`
- Gửi push notification cho tất cả người đặt

---

#### 13. GET /orders/history

**Query params:**
- `limit` (default: 30)
- `offset` (default: 0)
- `start_date`, `end_date`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": 50,
        "session_date": "2025-02-24",
        "status": "settled",
        "total_participants": 15,
        "total_bill": 500000,
        "amount_per_person": 33333,
        "payer": { "id": 1, "name": "Nguyen Van A" },
        "current_user_participated": true
      },
      {
        "id": 49,
        "session_date": "2025-02-23",
        "status": "settled",
        "total_participants": 12,
        "total_bill": 420000,
        "amount_per_person": 35000
      }
    ],
    "total": 89,
    "limit": 30,
    "offset": 0
  }
}
```

---

#### 14. GET /orders/:id

Chi tiết 1 session.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 50,
    "session_date": "2025-02-24",
    "status": "settled",
    "buyers": [
      { "id": 1, "name": "Nguyen Van A" }
    ],
    "participants": [
      { "id": 1, "name": "Nguyen Van A" },
      { "id": 2, "name": "User 2" }
      // ... 15 people
    ],
    "payer": { "id": 1, "name": "Nguyen Van A" },
    "total_bill": 500000,
    "amount_per_person": 33333,
    "bill_image_url": "https://storage.com/invoice.jpg",
    "paid_at": "2025-02-24T13:00:00Z"
  }
}
```

---

### 👤 User Endpoints

#### 15. GET /users

**[Admin only]**

**Query params:**
- `search` (search by name/email)
- `role` (filter)
- `is_active` (true/false)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Nguyen Van A",
      "email": "user@example.com",
      "role": "user",
      "balance": 150000,
      "is_active": true,
      "total_bought_times": 12
    }
  ]
}
```

---

#### 16. PUT /users/:id/balance

**[Admin only]** Điều chỉnh số dư thủ công.

**Request:**
```json
{
  "amount": -50000, // Có thể âm (trừ) hoặc dương (cộng)
  "note": "Điều chỉnh sai sót ngày 23/02"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Balance adjusted",
  "data": {
    "user_id": 1,
    "old_balance": 150000,
    "new_balance": 100000
  }
}
```

**Side effects:**
- Update `users.balance`
- Insert transaction với `type = 'adjustment'`

---

### 🔧 Admin Endpoints

#### 17. GET /admin/stats

**[Admin only]**

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total_users": 25,
    "active_users": 23,
    "total_balance": 3500000,
    "pending_deposits": 3,
    "today_orders": 15,
    "this_month_sessions": 18,
    "this_month_total_spent": 9500000
  }
}
```

---

#### 18. GET /admin/bank-info

**[All users]** Lấy thông tin STK admin để nạp tiền.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "bank_name": "Vietcombank",
    "account_number": "1234567890",
    "account_name": "NGUYEN VAN A"
  }
}
```

---

#### 19. PUT /admin/bank-info

**[Admin only]** Cập nhật STK.

**Request:**
```json
{
  "bank_name": "Techcombank",
  "account_number": "0987654321",
  "account_name": "TRAN THI B"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Bank info updated"
}
```

---

## ⚙️ Core Business Logic

### 🎯 Algorithm 1: Buyer Selection (BuyerSelectionService.js)

**Mục tiêu:** Chọn 4 người đi mua mỗi ngày sao cho:
1. Fair rotation (mỗi người được chọn đều nhau)
2. Không trùng 4 người hôm trước
3. Scalable (10-100 users)

**Pseudocode:**

```javascript
async function selectFourBuyers(sessionId) {
  // 1. Get today's orders
  const todayOrders = await LunchOrder.findAll({
    where: { session_id: sessionId, status: 'confirmed' },
    include: [{ model: User }]
  });
  
  if (todayOrders.length === 0) {
    throw new Error('No orders today');
  }
  
  // 2. Get yesterday's buyers
  const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
  const yesterdaySession = await LunchSession.findOne({
    where: { session_date: yesterday }
  });
  
  const yesterdayBuyerIds = yesterdaySession ? yesterdaySession.buyer_ids : [];
  
  // 3. Filter candidates: exclude yesterday's buyers
  let candidates = todayOrders
    .map(order => order.User)
    .filter(user => !yesterdayBuyerIds.includes(user.id));
  
  // 4. Sort by rotation_index ASC (người lâu chưa đi lên trước)
  candidates.sort((a, b) => {
    if (a.rotation_index !== b.rotation_index) {
      return a.rotation_index - b.rotation_index;
    }
    // Tie-breaker: last_bought_date ASC (null first)
    if (!a.last_bought_date) return -1;
    if (!b.last_bought_date) return 1;
    return new Date(a.last_bought_date) - new Date(b.last_bought_date);
  });
  
  // 5. Edge case: không đủ 4 người sau khi filter
  if (candidates.length < 4) {
    // Bổ sung từ yesterdayBuyers (chọn người có rotation_index thấp nhất)
    const needed = 4 - candidates.length;
    const extras = todayOrders
      .map(order => order.User)
      .filter(user => yesterdayBuyerIds.includes(user.id))
      .sort((a, b) => a.rotation_index - b.rotation_index)
      .slice(0, needed);
    
    candidates = [...candidates, ...extras];
  }
  
  // 6. Pick top 4
  const selectedBuyers = candidates.slice(0, 4);
  
  // 7. Update rotation_index
  await updateRotationIndex(selectedBuyers, todayOrders.length);
  
  // 8. Save to session
  await LunchSession.update(
    {
      buyer_ids: selectedBuyers.map(u => u.id),
      status: 'buyers_selected',
      selected_at: new Date()
    },
    { where: { id: sessionId } }
  );
  
  // 9. Send notifications
  await NotificationService.notifyBuyersSelected(selectedBuyers);
  
  return selectedBuyers;
}

async function updateRotationIndex(selectedBuyers, totalParticipants) {
  // Tìm max rotation_index hiện tại
  const maxIndex = await User.max('rotation_index');
  
  // Cập nhật 4 người được chọn
  for (const buyer of selectedBuyers) {
    await User.update(
      {
        rotation_index: maxIndex + 1,
        last_bought_date: new Date(),
        total_bought_times: buyer.total_bought_times + 1
      },
      { where: { id: buyer.id } }
    );
  }
  
  // Check nếu tất cả đã đi hết 1 vòng → Reset
  const minIndex = await User.min('rotation_index');
  if (minIndex >= totalParticipants) {
    await User.update({ rotation_index: 0 }, { where: {} });
  }
}
```

**Edge Cases:**

| Scenario | Solution |
|----------|----------|
| Chỉ có 3 người đặt cơm | Chọn cả 3, không đủ 4 → Accept |
| Tất cả người hôm nay trùng hôm qua (4 người) | Chọn dựa trên rotation_index only |
| User hủy đặt sau khi được chọn | Re-run selection or keep 3 buyers |
| 100 users cùng rotation_index | Tie-breaker: `last_bought_date ASC` |

---

### 💵 Algorithm 2: Settlement (SettlementService.js)

**Mục tiêu:** Quyết toán hóa đơn tự động:
1. +tiền cho người trả tiền
2. -tiền cho tất cả người đặt (chia đều)
3. Atomic transaction (all or nothing)

**Pseudocode:**

```javascript
async function settleInvoice(sessionId, payerId, totalBill, billImageUrl = null) {
  const session = await LunchSession.findByPk(sessionId, {
    include: [{ model: LunchOrder, where: { status: 'confirmed' } }]
  });
  
  if (!session) throw new Error('Session not found');
  if (session.status === 'settled') throw new Error('Already settled');
  if (!session.buyer_ids.includes(payerId)) {
    throw new Error('Only selected buyers can submit payment');
  }
  
  const participants = session.LunchOrders;
  const numPeople = participants.length;
  
  if (numPeople === 0) throw new Error('No participants');
  
  // Calculate amount per person
  const amountPerPerson = Math.round(totalBill / numPeople); // Round to nearest đồng
  
  // START ATOMIC TRANSACTION
  const t = await sequelize.transaction();
  
  try {
    // 1. +tiền cho người trả
    await User.increment('balance', {
      by: totalBill,
      where: { id: payerId },
      transaction: t
    });
    
    await Transaction.create({
      user_id: payerId,
      type: 'expense', // Paradox: expense nhưng +tiền vì họ bỏ tiền mặt ra
      amount: totalBill, // Positive
      status: 'completed',
      order_id: sessionId,
      note: `Trả tiền cơm ${session.session_date} - ${numPeople} người`,
      metadata: { role: 'payer', bill_image_url: billImageUrl }
    }, { transaction: t });
    
    // 2. -tiền cho tất cả (bao gồm payer)
    for (const order of participants) {
      await User.decrement('balance', {
        by: amountPerPerson,
        where: { id: order.user_id },
        transaction: t
      });
      
      await Transaction.create({
        user_id: order.user_id,
        type: 'expense',
        amount: -amountPerPerson, // Negative
        status: 'completed',
        order_id: sessionId,
        note: `Cơm ${session.session_date} - ${numPeople} người`,
        metadata: { amount_per_person: amountPerPerson }
      }, { transaction: t });
    }
    
    // 3. Update session
    await LunchSession.update({
      status: 'settled',
      payer_id: payerId,
      total_bill: totalBill,
      amount_per_person: amountPerPerson,
      bill_image_url: billImageUrl,
      paid_at: new Date()
    }, {
      where: { id: sessionId },
      transaction: t
    });
    
    // COMMIT
    await t.commit();
    
    // 4. Send notifications (AFTER commit)
    await NotificationService.notifySettlementComplete(sessionId, participants, amountPerPerson);
    
    return {
      session_id: sessionId,
      total_bill: totalBill,
      participants: numPeople,
      amount_per_person: amountPerPerson,
      payer_id: payerId
    };
    
  } catch (error) {
    // ROLLBACK
    await t.rollback();
    throw error;
  }
}
```

**Race Condition Handling:**

```javascript
// Use database row-level lock
const session = await LunchSession.findByPk(sessionId, {
  lock: t.LOCK.UPDATE, // Pessimistic lock
  transaction: t
});

if (session.status === 'settled') {
  throw new Error('Payment already submitted by another buyer');
}
```

**Balance Validation:**

```sql
-- Database constraint đã có:
ALTER TABLE users ADD CONSTRAINT check_balance_non_negative CHECK (balance >= 0);

-- Nếu balance âm sau khi trừ → Transaction rollback tự động
```

---

## 📡 Real-time Updates (WebSocket)

**Socket.io Events:**

| Event | Direction | Data | Description |
|-------|-----------|------|-------------|
| `order:joined` | Server → Clients | `{ user: {...}, total: 15 }` | User mới đặt cơm |
| `order:left` | Server → Clients | `{ user_id: 5, total: 14 }` | User hủy đặt |
| `buyers:selected` | Server → Clients | `{ buyers: [...] }` | 4 người được chọn |
| `payment:submitted` | Server → Clients | `{ payer: {...}, status: 'processing' }` | Đang xử lý thanh toán |
| `settlement:complete` | Server → Clients | `{ total_bill, amount_per_person }` | Quyết toán xong |

**Implementation:**

```javascript
// socket.js
const io = require('socket.io')(server, {
  cors: { origin: '*' }
});

io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected`);
  
  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected`);
  });
});

// Broadcast example
function broadcastOrderJoined(user) {
  io.emit('order:joined', {
    user: { id: user.id, name: user.name },
    total: currentTotal
  });
}
```

---

## 🔔 Push Notifications

**Firebase Cloud Messaging (FCM) / APNs**

**Notification Types:**

| Type | Trigger | Recipients | Priority |
|------|---------|-----------|----------|
| `daily_reminder` | 8:30 AM cron | All active users | Normal |
| `deposit_request` | User nạp tiền | Admin | High |
| `deposit_approved` | Admin approve | User đó | High |
| `buyer_selected` | 11:30 AM cron | 4 buyers | High |
| `settlement_complete` | Payment submitted | All participants | Normal |
| `low_balance` | Balance < 30k | User đó | Normal |

**Service Implementation:**

```javascript
// NotificationService.js
const admin = require('firebase-admin');

class NotificationService {
  static async sendPushNotification(userId, title, body, data = {}) {
    const user = await User.findByPk(userId);
    
    if (!user.fcm_token || !user.notification_enabled) {
      return;
    }
    
    const message = {
      notification: { title, body },
      data: data,
      token: user.fcm_token,
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };
    
    try {
      await admin.messaging().send(message);
      await NotificationLog.create({
        user_id: userId,
        type: data.type || 'general',
        title, body, data,
        status: 'sent'
      });
    } catch (error) {
      console.error('FCM error:', error);
      await NotificationLog.create({
        user_id: userId,
        type: data.type || 'general',
        title, body, data,
        status: 'failed',
        error_message: error.message
      });
    }
  }
  
  static async notifyBuyersSelected(buyers) {
    const promises = buyers.map(buyer => 
      this.sendPushNotification(
        buyer.id,
        '🛒 Bạn được chọn đi mua cơm!',
        'Hôm nay đến lượt bạn đi mua cơm cho cả team',
        { type: 'buyer_selected', session_date: moment().format('YYYY-MM-DD') }
      )
    );
    await Promise.all(promises);
  }
  
  static async notifySettlementComplete(sessionId, participants, amountPerPerson) {
    const promises = participants.map(order => 
      this.sendPushNotification(
        order.user_id,
        '✅ Đã thanh toán',
        `Bạn bị trừ ${formatCurrency(amountPerPerson)} cho cơm hôm nay`,
        { type: 'settlement_complete', session_id: sessionId, amount: amountPerPerson }
      )
    );
    await Promise.all(promises);
  }
}
```

---

## ⏰ Scheduled Jobs (Cron)

**node-cron setup:**

```javascript
// jobs/scheduler.js
const cron = require('node-cron');
const { sendDailyReminder } = require('./dailyReminder');
const { selectBuyersJob } = require('./selectBuyers');

// 8:30 AM: Nhắc đặt cơm
cron.schedule('30 8 * * *', async () => {
  console.log('[CRON] Running daily reminder at 8:30 AM');
  await sendDailyReminder();
}, {
  timezone: 'Asia/Ho_Chi_Minh'
});

// 11:30 AM: Chọn 4 người đi mua
cron.schedule('30 11 * * *', async () => {
  console.log('[CRON] Selecting buyers at 11:30 AM');
  await selectBuyersJob();
}, {
  timezone: 'Asia/Ho_Chi_Minh'
});
```

**Daily Reminder:**

```javascript
// jobs/dailyReminder.js
async function sendDailyReminder() {
  const users = await User.findAll({
    where: { is_active: true, notification_enabled: true }
  });
  
  const promises = users.map(user => 
    NotificationService.sendPushNotification(
      user.id,
      '🍚 Đặt cơm hôm nay chưa?',
      'Nhớ đặt cơm trước 11:30 để được chọn menu nhé!',
      { type: 'daily_reminder' }
    )
  );
  
  await Promise.all(promises);
  console.log(`[REMINDER] Sent to ${users.length} users`);
}
```

**Select Buyers:**

```javascript
// jobs/selectBuyers.js
async function selectBuyersJob() {
  const today = moment().format('YYYY-MM-DD');
  const session = await LunchSession.findOne({
    where: { session_date: today }
  });
  
  if (!session) {
    console.log('[SELECT BUYERS] No session today, skipping');
    return;
  }
  
  if (session.status !== 'ordering') {
    console.log('[SELECT BUYERS] Already selected, skipping');
    return;
  }
  
  try {
    await BuyerSelectionService.selectFourBuyers(session.id);
    console.log('[SELECT BUYERS] Success');
  } catch (error) {
    console.error('[SELECT BUYERS] Error:', error);
  }
}
```

---

## 🐳 Docker Compose Setup

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: lunch-fund-db
    environment:
      POSTGRES_DB: lunch_fund
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/db/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: lunch-fund-api
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: ${NODE_ENV:-development}
      PORT: 3000
      DATABASE_URL: postgresql://admin:${DB_PASSWORD}@postgres:5432/lunch_fund
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: 7d
      FIREBASE_PROJECT_ID: ${FIREBASE_PROJECT_ID}
      FIREBASE_PRIVATE_KEY: ${FIREBASE_PRIVATE_KEY}
      FIREBASE_CLIENT_EMAIL: ${FIREBASE_CLIENT_EMAIL}
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/node_modules
    restart: unless-stopped

  # Optional: pgAdmin for database management
  pgadmin:
    image: dpage/pgadmin4
    container_name: lunch-fund-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@lunch-fund.com
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD}
    ports:
      - "5050:80"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

**backend/Dockerfile:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
```

**`.env.example`:**

```env
# Environment
NODE_ENV=development

# Server
PORT=3000

# Database
DATABASE_URL=postgresql://admin:secret@localhost:5432/lunch_fund
DB_PASSWORD=secret

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Firebase (FCM)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# Admin (for pgAdmin)
PGADMIN_PASSWORD=admin123

# App Config
BUYER_COUNT=4
ORDER_DEADLINE_TIME=11:30
LOW_BALANCE_THRESHOLD=30000
```

**Run:**

```bash
docker-compose up -d
```

---

## 📊 Diagrams

### ERD (Entity Relationship Diagram)

```mermaid
erDiagram
    USERS ||--o{ TRANSACTIONS : "has"
    USERS ||--o{ LUNCH_ORDERS : "places"
    LUNCH_SESSIONS ||--o{ LUNCH_ORDERS : "contains"
    LUNCH_SESSIONS ||--o{ TRANSACTIONS : "generates"
    USERS ||--o| LUNCH_SESSIONS : "pays (payer_id)"
    USERS }o--o{ LUNCH_SESSIONS : "selected as buyer (buyer_ids)"

    USERS {
        int id PK
        string email UK
        string password_hash
        string name
        string phone
        string role
        decimal balance
        date last_bought_date
        int rotation_index
        int total_bought_times
        string fcm_token
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    TRANSACTIONS {
        int id PK
        int user_id FK
        string type
        decimal amount
        string status
        int admin_id FK
        int order_id FK
        text note
        jsonb metadata
        timestamp created_at
        timestamp approved_at
    }

    LUNCH_SESSIONS {
        int id PK
        date session_date UK
        string status
        int[] buyer_ids
        int payer_id FK
        decimal total_bill
        decimal amount_per_person
        text bill_image_url
        int total_participants
        timestamp created_at
        timestamp updated_at
    }

    LUNCH_ORDERS {
        int id PK
        int session_id FK
        int user_id FK
        string status
        timestamp created_at
        timestamp cancelled_at
    }
```

### Sequence Diagram: Buyer Selection

```mermaid
sequenceDiagram
    participant Cron as Cron Job (11:30 AM)
    participant API as Backend API
    participant BuyerService as BuyerSelectionService
    participant DB as PostgreSQL
    participant NotifService as NotificationService
    participant FCM as Firebase FCM

    Cron->>API: POST /orders/today/select-buyers
    API->>BuyerService: selectFourBuyers(sessionId)
    
    BuyerService->>DB: Get today's orders
    DB-->>BuyerService: [User1, User2, ..., User15]
    
    BuyerService->>DB: Get yesterday's buyers
    DB-->>BuyerService: [User2, User3, User7, User9]
    
    BuyerService->>BuyerService: Filter candidates<br/>(exclude yesterday)
    BuyerService->>BuyerService: Sort by rotation_index ASC
    BuyerService->>BuyerService: Pick top 4
    
    BuyerService->>DB: Update rotation_index<br/>for 4 selected buyers
    BuyerService->>DB: Update lunch_sessions<br/>(buyer_ids, status='buyers_selected')
    
    BuyerService->>NotifService: notifyBuyersSelected(buyers)
    loop For each buyer
        NotifService->>FCM: Send push notification
        FCM-->>NotifService: OK
    end
    
    NotifService-->>BuyerService: Notifications sent
    BuyerService-->>API: { buyers: [...] }
    API-->>Cron: 200 OK
```

### Sequence Diagram: Settlement

```mermaid
sequenceDiagram
    participant User as User (Buyer)
    participant API as Backend API
    participant SettleService as SettlementService
    participant DB as PostgreSQL
    participant NotifService as NotificationService
    participant FCM as Firebase FCM

    User->>API: POST /orders/today/payment<br/>{ total_bill: 500000 }
    API->>SettleService: settleInvoice(sessionId, payerId, 500k)
    
    SettleService->>DB: BEGIN TRANSACTION
    
    SettleService->>DB: Lock lunch_session row<br/>(pessimistic lock)
    DB-->>SettleService: Locked (status='buyers_selected')
    
    SettleService->>DB: Get participants<br/>(lunch_orders)
    DB-->>SettleService: 15 participants
    
    SettleService->>SettleService: Calculate:<br/>amount_per_person = 500k / 15 = 33,333
    
    SettleService->>DB: users.balance += 500k<br/>WHERE id = payerId
    SettleService->>DB: INSERT transaction<br/>(payer, +500k)
    
    loop For each participant (15 people)
        SettleService->>DB: users.balance -= 33k<br/>WHERE id = participant.id
        SettleService->>DB: INSERT transaction<br/>(participant, -33k)
    end
    
    SettleService->>DB: UPDATE lunch_sessions<br/>(status='settled', payer_id, total_bill, ...)
    
    SettleService->>DB: COMMIT TRANSACTION
    DB-->>SettleService: Transaction committed
    
    SettleService->>NotifService: notifySettlementComplete(participants)
    loop For each participant
        NotifService->>FCM: Send notification<br/>"Bạn bị trừ 33k"
        FCM-->>NotifService: OK
    end
    
    SettleService-->>API: { success: true, ... }
    API-->>User: 200 OK
```

---

## 🧪 Testing Strategy

### Unit Tests

**Priority test cases:**

1. **BuyerSelectionService:**
   - ✅ Chọn 4 người từ 15 người
   - ✅ Không trùng hôm qua
   - ✅ Rotation fair (mỗi người được chọn đều)
   - ✅ Edge case: chỉ có 3 người
   - ✅ Edge case: tất cả trùng hôm qua
   - ✅ Reset rotation khi hết vòng

2. **SettlementService:**
   - ✅ Tính toán đúng amount_per_person
   - ✅ Atomic transaction (rollback khi lỗi)
   - ✅ Balance không âm
   - ✅ Không settle 2 lần (idempotent)

**Example test:**

```javascript
// tests/unit/buyerSelection.test.js
const { selectFourBuyers } = require('../../src/services/BuyerSelectionService');

describe('BuyerSelectionService', () => {
  it('should select 4 buyers who did not buy yesterday', async () => {
    // Arrange
    const sessionId = 1;
    await seedDatabase(); // 15 users ordered today, 4 bought yesterday
    
    // Act
    const buyers = await selectFourBuyers(sessionId);
    
    // Assert
    expect(buyers).toHaveLength(4);
    expect(buyers.map(b => b.id)).not.toContain(yesterdayBuyerIds);
  });
  
  it('should handle edge case: only 3 people ordered', async () => {
    // Arrange
    const sessionId = 2;
    await seedDatabase({ totalOrders: 3 });
    
    // Act
    const buyers = await selectFourBuyers(sessionId);
    
    // Assert
    expect(buyers).toHaveLength(3); // Accept 3 buyers
  });
});
```

### Integration Tests

**API endpoint tests:**

```javascript
// tests/integration/api.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('POST /orders/today/join', () => {
  it('should allow user to order lunch', async () => {
    const token = await getAuthToken();
    
    const res = await request(app)
      .post('/api/orders/today/join')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
  
  it('should reject if already ordered', async () => {
    const token = await getAuthToken();
    await orderLunch(token); // First order
    
    const res = await request(app)
      .post('/api/orders/today/join')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Already ordered');
  });
});
```

---

## 🔒 Security Considerations

### 1. Authentication & Authorization

- **JWT:** HS256, expire 7 days, refresh token nếu cần
- **Password:** bcrypt rounds = 10
- **Role-based access:** Middleware kiểm tra `user.role`

### 2. Input Validation

```javascript
// middleware/validator.js
const { body, validationResult } = require('express-validator');

const validateDeposit = [
  body('amount').isFloat({ min: 1000 }).withMessage('Amount must be >= 1000'),
  body('note').optional().isLength({ max: 500 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    next();
  }
];
```

### 3. SQL Injection Prevention

- ✅ Dùng Sequelize ORM (parameterized queries)
- ✅ KHÔNG dùng raw SQL với string concatenation

### 4. Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
  message: 'Too many requests'
});

app.use('/api/', limiter);
```

### 5. CORS

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://lunch-fund.com' 
    : '*',
  credentials: true
}));
```

---

## 📈 Performance Optimization

### Database Indexes

- ✅ `users(email)` - login lookup
- ✅ `users(rotation_index, last_bought_date)` - buyer selection
- ✅ `transactions(user_id, created_at)` - history lookup
- ✅ `lunch_orders(session_id, status)` - today's orders
- ✅ `lunch_sessions(session_date)` - date lookup

### Caching Strategy

**Redis (Optional):**

```javascript
// Cache today's session
const todaySession = await redis.get(`session:${today}`);
if (todaySession) {
  return JSON.parse(todaySession);
}

const session = await LunchSession.findOne({ where: { session_date: today } });
await redis.setex(`session:${today}`, 3600, JSON.stringify(session));
```

### Database Connection Pooling

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

---

## 🚀 Deployment Checklist

### Pre-deployment

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Firebase credentials set up
- [ ] SSL certificates ready (HTTPS)
- [ ] Cron jobs tested
- [ ] Load testing completed

### Production Deployment

```bash
# Build and start
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker exec lunch-fund-api npm run migrate

# Seed initial data
docker exec lunch-fund-api npm run seed

# Check logs
docker logs -f lunch-fund-api
```

### Monitoring

- **Logs:** Winston logger → CloudWatch / Datadog
- **Metrics:** Prometheus + Grafana
- **Error tracking:** Sentry
- **Uptime:** UptimeRobot / Pingdom

---

## 📚 Tech Dependencies

**Backend:**

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "sequelize": "^6.35.2",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "express-validator": "^7.0.1",
    "express-rate-limit": "^7.1.5",
    "socket.io": "^4.6.1",
    "firebase-admin": "^12.0.0",
    "node-cron": "^3.0.3",
    "dotenv": "^16.3.1",
    "winston": "^3.11.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "moment": "^2.30.1"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "nodemon": "^3.0.2"
  }
}
```

---

## 📞 Support & Maintenance

### Critical Paths to Monitor

1. **Buyer Selection (11:30 AM):** Nếu fail → Manual admin select
2. **Settlement Transaction:** Nếu rollback → Check logs, retry
3. **Push Notifications:** Nếu fail → Log to `notification_logs`, retry

### Rollback Plan

```bash
# Restore database from backup
docker exec lunch-fund-db pg_restore -U admin -d lunch_fund /backups/backup.sql

# Revert to previous Docker image
docker-compose down
docker-compose up -d --build --force-recreate
```

---

## ✅ Done!

Architecture thiết kế xong! Key points:

1. ✅ **Database schema** với indexes, constraints, triggers
2. ✅ **API contract** đầy đủ (18 endpoints)
3. ✅ **Buyer Selection algorithm** (rotation + no-repeat)
4. ✅ **Settlement logic** (atomic transactions)
5. ✅ **Real-time updates** (WebSocket)
6. ✅ **Push notifications** (FCM)
7. ✅ **Cron jobs** (8:30 AM reminder, 11:30 AM select)
8. ✅ **Docker Compose** setup
9. ✅ **Diagrams** (ERD, sequence diagrams)
10. ✅ **Security & testing** strategies

---

**Next Step:** @PmQuick_bot review → Assign tasks cho @coder_Quick_bot 🚀
