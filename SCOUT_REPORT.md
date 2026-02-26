# Lunch Order System - Scout Report
**Date:** 2026-02-26
**Status:** Complete Codebase Analysis

---

## 1. DATABASE SCHEMA

### 1.1 Users Table
**File:** `/backend/db/init.sql` (lines 15-45)

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
```

**Column Details:**
- `rotation_index`: Used for fair rotation of buyer selection (lower = more likely to be selected)
- `last_bought_date`: DATE of last buyer selection
- `total_bought_times`: Counter of times selected as buyer
- `fcm_token`: Firebase Cloud Messaging token for push notifications
- `balance`: Account balance for lunch fund (rounded to 2 decimals, must be >= 0)

---

### 1.2 Lunch Sessions Table
**File:** `/backend/db/init.sql` (lines 50-76)

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
```

**Key States:**
1. `ordering` - Users can join/leave
2. `buyers_selected` - 4 buyers chosen, only they can submit payment
3. `buying` - Buyers are out buying food
4. `payment_submitted` - One buyer has submitted the bill
5. `settled` - Payments deducted, reimbursement request created
6. `cancelled` - Session cancelled

---

### 1.3 Lunch Orders Table
**File:** `/backend/db/init.sql` (lines 116-127)

```sql
CREATE TABLE lunch_orders (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES lunch_sessions(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cancelled_at TIMESTAMP,
  
  UNIQUE(session_id, user_id)
);
```

**Purpose:** Tracks which users joined which lunch session
**Constraint:** One user can only have one order per session

---

### 1.4 Transactions Table
**File:** `/backend/db/init.sql` (lines 85-106)

```sql
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
```

**Transaction Types:**
- `deposit`: User requests to add balance (requires admin approval)
- `income`: Credit to account
- `expense`: Debit from account (when lunch settled)
- `refund`: Refund transaction
- `adjustment`: Admin manual adjustment

---

### 1.5 Notification Logs Table
**File:** `/backend/db/init.sql` (lines 154-164)

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
```

**Purpose:** Audit trail of all push notifications sent

---

### 1.6 Reimbursement Requests Table (Migration v2)
**File:** `/backend/db/migration_v2.sql` (lines 99-127)

```sql
CREATE TABLE reimbursement_requests (
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
```

**Purpose:** Tracks reimbursement requests for lunch buyers and snack creators
**Statuses:**
1. `pending` - Waiting for admin to transfer money
2. `admin_transferred` - Admin marked as sent, waiting user confirmation
3. `user_confirmed` - User confirmed receipt
4. `user_disputed` - User says money not received

---

### 1.7 Snack Menus & Related Tables (Migration v2)
**File:** `/backend/db/migration_v2.sql` (lines 8-88)

```sql
CREATE TABLE snack_menus (
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

CREATE TABLE snack_menu_items (
  id SERIAL PRIMARY KEY,
  snack_menu_id INTEGER NOT NULL REFERENCES snack_menus(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(12, 2) NOT NULL CHECK (price > 0),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE snack_user_orders (
  id SERIAL PRIMARY KEY,
  snack_menu_id INTEGER NOT NULL REFERENCES snack_menus(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  item_id INTEGER NOT NULL REFERENCES snack_menu_items(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(snack_menu_id, user_id, item_id)
);
```

---

## 2. BACKEND ORDER CONTROLLER

**File:** `/backend/src/controllers/OrderController.js`

### Key Methods

#### 2.1 GET /orders/today
```javascript
async getToday(req, res)
```
- Gets today's lunch session (auto-creates if doesn't exist)
- Returns session info: status, buyers, total participants
- Checks if current user has joined
- **Date Logic:** Uses `moment().format('YYYY-MM-DD')`

#### 2.2 POST /orders/today/join
```javascript
async joinToday(req, res)
```
- User joins today's lunch order
- Checks for duplicates (one order per user per session)
- Inserts into `lunch_orders` table with status='confirmed'
- **Requires:** Authentication

#### 2.3 DELETE /orders/today/leave
```javascript
async leaveToday(req, res)
```
- User leaves lunch order
- **Constraint:** Cannot leave after buyers are selected (status !== 'ordering')
- Deletes from `lunch_orders` table

#### 2.4 POST /orders/today/select-buyers
```javascript
async selectBuyers(req, res)
```
- Calls `BuyerSelectionService.selectFourBuyers(sessionId)`
- Returns selected buyer list with id, name, email
- **Requires:** Admin role

#### 2.5 POST /orders/today/payment
```javascript
async submitPayment(req, res)
```
**Parameters:**
- `total_bill`: Total bill amount (numeric, > 0)
- `bill_image_url`: Optional bill image

**Flow:**
1. Calls `SettlementService.settleInvoice(sessionId, payerId, totalBill, billImageUrl)`
2. **Requires:** User must be in buyer_ids list
3. Returns settlement details including reimbursement_id

#### 2.6 GET /orders/history
```javascript
async getHistory(req, res)
```
- Gets user's order history (last 30 by default)
- Shows: session_date, status, was_buyer, was_payer, amount_per_person
- Ordered by session_date DESC

#### 2.7 GET /orders/:id
```javascript
async getById(req, res)
```
- Gets detailed info of specific session
- Returns: session, orders list, buyers list, payer info

#### 2.8 Helper: _getOrCreateSession
```javascript
async _getOrCreateSession(date)
```
- Gets session for given date or creates it with status='ordering'

---

## 3. BACKEND ROUTES

**File:** `/backend/src/routes/orders.js`

```javascript
GET /orders/today
POST /orders/today/join
DELETE /orders/today/leave
POST /orders/today/select-buyers (requireAdmin)
POST /orders/today/payment
GET /orders/history
GET /orders/:id
```

**All routes require:** `authenticate` middleware

---

## 4. FRONTEND ORDER PAGE

**File:** `/web/src/app/(dashboard)/order/page.tsx`

### UI States & Logic

**Date Handling:**
- Checks if past 12:00 PM (noon) → shows "Đặt cơm ngày mai" instead
- Uses `isForTomorrow` flag from `useOrder` hook
- Displays target date as: `new Date(targetDate).toLocaleDateString('vi-VN')`

### Session Status Badges:
```javascript
const STATUS_LABELS = {
  ordering: '🟢 Đang đặt',
  open: '🟢 Đang mở',
  locked: '🔒 Đã chốt',
  buyers_selected: '🛒 Đã chọn người mua',
  settled: '✅ Đã thanh toán',
  finalized: '📋 Hoàn tất',
};
```

### Key UI Sections:

1. **Session Header:** Shows date, participant count, status badge

2. **Buyer Payment Form** (visible when):
   - User is in `buyers_selected` list
   - Session status is 'buyers_selected' or 'buying'
   - Shows total bill input, note field
   - Displays "Mỗi người trả: ~X VND" calculation
   - Calls `ordersService.submitPayment({ total_bill, note })`

3. **Buyers List:** Shows the 4 selected buyers

4. **Participants List:** Shows all users who joined, with ordering number

5. **Join/Leave Button:** 
   - Sticky bottom (mobile: bottom-20, desktop: bottom-4)
   - Changes text based on `isForTomorrow` flag
   - Disabled if `isLoading`

### API Hooks Used:
```typescript
useOrder() // Provides: todaySession, participants, buyers, isJoined, isLoading, targetDate, joinOrder(), leaveOrder()
useAuthStore() // Provides: user, fetchUser()
```

### Payment Flow:
1. User enters `total_bill` amount
2. Confirmation toast shows per-person calculation
3. Calls `ordersService.submitPayment()`
4. On success: resets form, calls `fetchUser()` to refresh balance
5. Shows toast: "Admin sẽ chuyển khoản {amount} cho bạn"

---

## 5. NOTIFICATION SYSTEM

**File:** `/backend/src/services/NotificationService.js`

### Firebase Configuration
```javascript
_initFirebase() {
  if (process.env.FIREBASE_PROJECT_ID) {
    const admin = require('firebase-admin');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  }
}
```

**Required .env variables:**
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`

**Fallback:** If Firebase not configured, sends mock notifications to console

### Notification Types:

1. **Daily Reminder** (8:30 AM)
   ```
   Title: 🍱 Nhắc nhở đặt cơm hôm nay!
   Body: Đừng quên đặt cơm trưa nhé! Chốt sổ lúc 11:30 AM.
   ```

2. **Buyers Selected** (after selection)
   ```
   Title: 🎯 Bạn được chọn đi mua cơm!
   Body: Hôm nay (DATE) bạn là 1 trong 4 người đi mua. Nhớ ghé mua nhé!
   ```

3. **Payment Reminder** (for buyers)
   ```
   Title: 💰 Nhắc nhở thanh toán
   Body: Đã mua xong chưa? Nhớ chụp bill và submit thanh toán nhé!
   ```

4. **Settlement Complete** (after payment)
   - For payer: Shows total_bill and amount_per_person deducted
   - For others: Shows amount_per_person deducted

5. **Low Balance Warning** (when balance < threshold)
   ```
   Body: Số dư còn X VND. Nạp thêm để đảm bảo đủ tiền đặt cơm nhé!
   ```

6. **Deposit Approved** (after admin approves)
   ```
   Title: ✅ Nạp tiền thành công
   Body: Admin đã duyệt yêu cầu nạp X VND của bạn.
   ```

7. **Deposit Rejected** (after admin rejects)
   ```
   Title: ❌ Yêu cầu nạp tiền bị từ chối
   Body: [Reason or generic message]
   ```

### Methods:
- `sendPushNotification(fcmToken, title, body, data)` - Single user
- `sendMulticastNotification(fcmTokens, title, body, data)` - Multiple users
- `_logNotification()` - Logs to notification_logs table

---

## 6. ROTATION & BUYER TRACKING

**File:** `/backend/src/services/BuyerSelectionService.js`

### Algorithm:
1. Get today's confirmed orders
2. Get yesterday's buyer_ids
3. **Primary selection:** Candidates who weren't buyers yesterday
4. **Sorting:** By `rotation_index` ASC, then `last_bought_date` ASC (nulls first)
5. **Edge case:** If < 4 candidates available, add yesterday's buyers

### User Fields Updated:
```javascript
rotation_index: maxIndex + 1,
last_bought_date: sessionDate,
total_bought_times: total_bought_times + 1
```

### Rotation Cycle:
- When all active users have same rotation_index (and > 0):
  - Cycle is complete → reset all rotation_index to 0
  - Starts new cycle

### Selection Logic (lines 19-129):
```javascript
async selectFourBuyers(sessionId)
  1. Fetch session & verify status='ordering'
  2. Get today's orders: ORDER BY rotation_index ASC, last_bought_date ASC
  3. Get yesterday's buyer_ids
  4. Filter candidates (exclude yesterday's buyers)
  5. If < 4: add yesterday's buyers sorted by rotation_index
  6. Select min(4, candidates.length)
  7. Update rotation_index for selected
  8. Check if rotation cycle complete → reset
  9. Save buyer_ids to session, change status='buyers_selected'
  10. Send notifications
```

---

## 7. REIMBURSEMENT SYSTEM

**File:** `/backend/src/routes/reimbursements.js`

### Flow:
1. After settlement: Reimbursement request created with status='pending'
2. Admin views `/reimbursements/pending` (GET)
3. Admin clicks "Đã chuyển tiền": PUT `/:id/transfer` → status='admin_transferred'
4. User sees "Xác nhận nhận tiền": PUT `/:id/confirm` → status='user_confirmed'

### ReimbursementController Methods:

#### getPending (Admin only)
- Returns all pending reimbursements
- Shows settler name, amount, context (session_date or snack title)

#### getAll (Admin only)
- All reimbursements with full history
- Normalizes to unified format for web/mobile

#### getMine (User)
- Get reimbursements for current user
- Ordered by created_at DESC

#### markTransferred (Admin)
- PUT `/:id/transfer` with optional note
- Updates status to 'admin_transferred'
- Sets `admin_id`, `admin_note`, `admin_transferred_at`
- **Constraint:** Only works if status='pending'

#### confirmReceipt (User)
- PUT `/:id/confirm` with body: `{ response: 'received'|'not_received' }`
- Sets status to 'user_confirmed' or 'user_disputed'
- Sets `user_response` and `user_confirmed_at`
- **Constraint:** Only works if status='admin_transferred'

### Normalization (Lines 4-25):
```javascript
statusMap: {
  'pending' → 'pending',
  'admin_transferred' → 'transferred',
  'user_confirmed' → 'confirmed',
  'user_disputed' → 'disputed'
}

typeMap: {
  'lunch' → 'lunch_buyer',
  'snack' → 'snack_creator'
}
```

---

## 8. SETTLEMENT ALGORITHM (v2)

**File:** `/backend/src/services/SettlementService.js`

### New Flow (Updated):
```
Buyer pays actual bill → Enters total_bill amount
System divides equally → amountPerPerson = ceil(totalBill / numPeople)
ALL participants deducted → including the buyer
Reimbursement created → Admin transfers totalBill to buyer
User confirms receipt → Settlement complete
```

### Key Difference from v1:
- **v1:** Payer got auto-credited
- **v2:** Payer does NOT get auto-credited. Admin transfers via bank instead.

### Settlement Steps (Lines 23-158):
```javascript
1. Lock session row (pessimistic locking)
2. Validate: session exists, status != 'settled', payer is in buyer_ids
3. Get all confirmed participants
4. Calculate: amountPerPerson = round(totalBill / numPeople)
5. Validate all have sufficient balance
6. Deduct amountPerPerson from ALL participants
7. Create expense transactions for all
8. Update session: status='settled', save payer_id, total_bill, amount_per_person, paid_at
9. Create reimbursement_request: type='lunch', reference_id=sessionId, settler_id=payerId, total_amount=totalBill
10. Send notifications
```

### Reimbursement Creation:
```sql
INSERT INTO reimbursement_requests
  (type, reference_id, settler_id, total_amount, status)
VALUES ('lunch', sessionId, payerId, totalBill, 'pending')
```

---

## 9. DEPOSIT & TRANSACTION FLOW

**File:** `/backend/src/services/TransactionService.js`

### Deposit Flow:
1. User creates deposit request → status='pending'
2. Admin approves → status='approved', balance increased
3. Notification sent → "Admin đã duyệt..."

### Transaction Types Created:
- `deposit`: User requests to add balance
- `expense`: Deducted when lunch settled
- `adjustment`: Admin manual adjustments

### Key Methods:
- `createDepositRequest(userId, amount, note, bankReference)`
- `approveDeposit(transactionId, adminId)`
- `rejectDeposit(transactionId, adminId, reason)`
- `adjustBalance(userId, amount, adminId, note)`
- `getUserTransactions(userId, limit)`

---

## 10. SNACK MENU SYSTEM

**File:** `/backend/src/controllers/WebSnackController.js`

### Model:
- Creator defines menu items (name + price)
- Users pick items and quantities
- Creator finalizes → deducts per-user cost + creates reimbursement

### Menu Lifecycle:
1. `ordering` - Accepting orders
2. `settled` - Finalizing (creator clicks "Chốt")
3. `cancelled` - Cancelled

### Finalization (Lines 300-400):
```javascript
async finalizeMenu(menuId, actorId, isAdmin)
  1. Lock menu row
  2. Verify: status='ordering', actor is creator or admin
  3. Get all orders by user: SUM(price * quantity)
  4. Check all have sufficient balance
  5. For each user:
     - Deduct total from balance
     - Create expense transaction
  6. Update menu: status='settled', total_amount, settled_at, settled_by
  7. Create reimbursement: type='snack', settler_id=creator, total_amount=sum
  8. Commit
```

---

## SUMMARY TABLE

| Component | Location | Key Feature |
|-----------|----------|------------|
| DB Schema | `/backend/db/init.sql` | 7 tables, proper constraints |
| Buyer Selection | `BuyerSelectionService.js` | Fair rotation algorithm |
| Settlement | `SettlementService.js` | v2: No auto-credit for payer |
| Reimbursement | `ReimbursementController.js` | 4-step flow: pending→transferred→confirmed→disputed |
| Notifications | `NotificationService.js` | Firebase FCM, 7 notification types |
| Frontend | `/order/page.tsx` | Real-time polling, payment form, buyer badge |
| Transactions | `TransactionService.js` | Deposits, expenses, adjustments |
| Snacks | `WebSnackController.js` | Restaurant-style menu ordering |

