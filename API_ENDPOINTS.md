# 📖 API DOCUMENTATION

## 🌐 Base URL
```
Local: http://localhost:3000
Production: https://api.yourdomain.com (when deployed to cloud)
```

## 🔐 Authentication
All endpoints (except `/health`, `/api/auth/register`, `/api/auth/login`) require JWT token:
avd
```
Authorization: Bearer <jwt_token>
```

---

## 📍 ENDPOINTS (18 Total)

### 🔓 Public Endpoints

#### Health Check
```http
GET /health
```
Response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-25T04:46:45.185Z",
  "uptime": 23.319
}
```

---

### 🔑 Authentication (3 endpoints)

#### 1. Register New User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "john@example.com",
      "name": "John Doe",
      "role": "user",
      "balance": 0
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 2. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

Response: Same as register

#### 3. Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe",
    "role": "user",
    "balance": 50000,
    "created_at": "2026-02-25T04:00:00Z"
  }
}
```

---

### 🍱 Orders (7 endpoints)

#### 4. Get Today's Meal Session
```http
GET /api/orders/today
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "session": {
      "id": 123,
      "date": "2026-02-25",
      "status": "open",
      "total_participants": 15,
      "buyer_count": 0
    },
    "participants": [
      {
        "user_id": 1,
        "name": "John Doe",
        "has_ordered": true
      }
    ],
    "selected_buyers": [],
    "user_has_ordered": true
  }
}
```

#### 5. Join Today's Session (Order Lunch)
```http
POST /api/orders/today/join
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "message": "Đã đặt cơm thành công!"
}
```

#### 6. Leave Today's Session (Cancel Order)
```http
DELETE /api/orders/today/leave
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "message": "Đã hủy đặt cơm"
}
```

#### 7. Select 4 Buyers [Admin Only]
```http
POST /api/orders/today/select-buyers
Authorization: Bearer <admin_token>
```

Response:
```json
{
  "success": true,
  "data": {
    "selected_buyers": [
      {"user_id": 1, "name": "John Doe"},
      {"user_id": 2, "name": "Jane Smith"},
      {"user_id": 3, "name": "Bob Wilson"},
      {"user_id": 4, "name": "Alice Brown"}
    ]
  }
}
```

#### 8. Submit Payment [Buyer Only]
```http
POST /api/orders/today/payment
Authorization: Bearer <buyer_token>
Content-Type: application/json

{
  "totalAmount": 300000,
  "receiptImage": "https://example.com/receipt.jpg"
}
```

Response:
```json
{
  "success": true,
  "message": "Đã submit thanh toán. Đang chờ buyer khác xác nhận...",
  "data": {
    "settlement": {
      "id": 456,
      "session_id": 123,
      "total_amount": 300000,
      "per_person": 20000,
      "status": "pending_confirmation"
    }
  }
}
```

#### 9. Get Order History
```http
GET /api/orders/history?limit=20&offset=0
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "session_id": 123,
        "date": "2026-02-25",
        "status": "completed",
        "amount_paid": 20000,
        "was_buyer": false
      }
    ],
    "total": 50
  }
}
```

#### 10. Get Session Details
```http
GET /api/orders/:id
Authorization: Bearer <token>
```

Response: Full session details including participants, buyers, settlement info

---

### 💰 Transactions (4 endpoints)

#### 11. Request Deposit
```http
POST /api/transactions/deposit
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 500000,
  "transferProof": "https://example.com/transfer.jpg"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "deposit": {
      "id": 789,
      "user_id": 1,
      "amount": 500000,
      "status": "pending",
      "created_at": "2026-02-25T05:00:00Z"
    }
  }
}
```

#### 12. Get Pending Deposits [Admin Only]
```http
GET /api/transactions/pending
Authorization: Bearer <admin_token>
```

Response:
```json
{
  "success": true,
  "data": {
    "pending_deposits": [
      {
        "id": 789,
        "user_id": 1,
        "user_name": "John Doe",
        "amount": 500000,
        "transfer_proof": "https://...",
        "created_at": "2026-02-25T05:00:00Z"
      }
    ]
  }
}
```

#### 13. Approve Deposit [Admin Only]
```http
PUT /api/transactions/:id/approve
Authorization: Bearer <admin_token>
```

Response:
```json
{
  "success": true,
  "message": "Đã duyệt nạp tiền thành công",
  "data": {
    "new_balance": 550000
  }
}
```

#### 14. Reject Deposit [Admin Only]
```http
PUT /api/transactions/:id/reject
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "Thông tin chuyển khoản không khớp"
}
```

Response:
```json
{
  "success": true,
  "message": "Đã từ chối yêu cầu nạp tiền"
}
```

---

### 📊 Admin (4 endpoints)

#### 15. Get System Stats [Admin Only]
```http
GET /api/admin/stats
Authorization: Bearer <admin_token>
```

Response:
```json
{
  "success": true,
  "data": {
    "total_users": 50,
    "active_users_today": 32,
    "total_sessions": 120,
    "total_fund_balance": 5000000,
    "pending_deposits": 3
  }
}
```

#### 16. Get Bank Info
```http
GET /api/admin/bank-info
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "bank_name": "Vietcombank",
    "account_number": "0123456789",
    "account_name": "NGUYEN VAN A",
    "qr_code": "https://example.com/qr.png"
  }
}
```

#### 17. Update Bank Info [Admin Only]
```http
PUT /api/admin/bank-info
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "bankName": "Techcombank",
  "accountNumber": "9876543210",
  "accountName": "TRAN THI B",
  "qrCode": "https://example.com/new-qr.png"
}
```

Response:
```json
{
  "success": true,
  "message": "Đã cập nhật thông tin ngân hàng"
}
```

#### 18. Get All Users [Admin Only]
```http
GET /api/admin/users?limit=50&offset=0
Authorization: Bearer <admin_token>
```

Response:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user",
        "balance": 50000,
        "created_at": "2026-01-15T00:00:00Z"
      }
    ],
    "total": 50
  }
}
```

---

## 🔒 Role-Based Access

### User Role
- Can order lunch
- Can request deposits
- Can view own history
- Can view bank info

### Admin Role
All user permissions PLUS:
- Select buyers
- Approve/reject deposits
- View system stats
- View all users
- Update bank info
- Adjust user balances

---

## 🚨 Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

Common status codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🧪 Test Credentials

**Admin Account:**
```
Email: admin@lunchfund.com
Password: Admin123!
```

**Test Users:**
```
user1@test.com → user5@test.com
Password: User123!
```

**Test Account (Created During Testing):**
```
Email: admin@test.com
Password: Admin123456
```

---

## 📝 Notes

1. **Token Expiry:** JWT tokens expire after 7 days
2. **Date Format:** All dates in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
3. **Currency:** All amounts in VND (Vietnamese Dong)
4. **Timezone:** Asia/Ho_Chi_Minh (GMT+7)
5. **CORS:** Currently allowing all origins (`*`) - restrict in production
6. **Rate Limiting:** Not implemented yet - should add for production

---

## 🔄 Typical User Flows

### Flow 1: New User Onboarding
1. `POST /api/auth/register` → Get token
2. `GET /api/admin/bank-info` → View bank details
3. `POST /api/transactions/deposit` → Request first deposit
4. Wait for admin approval
5. `GET /api/auth/me` → Check updated balance

### Flow 2: Daily Lunch Order
1. `GET /api/orders/today` → Check today's session
2. `POST /api/orders/today/join` → Order lunch
3. Wait for admin to select buyers
4. If selected as buyer → `POST /api/orders/today/payment`
5. Settlement auto-processes

### Flow 3: Admin Daily Tasks
1. `GET /api/transactions/pending` → Check deposit requests
2. `PUT /api/transactions/:id/approve` → Approve deposits
3. `GET /api/orders/today` → View today's orders
4. `POST /api/orders/today/select-buyers` → Select 4 buyers
5. `GET /api/admin/stats` → Monitor system health

---

**Last Updated:** 2026-02-25  
**API Version:** 1.0.0  
**Status:** ✅ Production Ready
