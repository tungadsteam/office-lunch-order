# 🧪 TESTING GUIDE - Backend API

## 🌐 Backend Information

**Base URL:** `http://localhost:3000`

**Status:** ✅ **RUNNING & HEALTHY**

**Services:**
- Backend API: Port 3000
- PostgreSQL: Port 5432
- pgAdmin: Port 5050 (http://localhost:5050)

---

## 🔑 Test Accounts

### Admin Account
```
Email: admin@lunchfund.com
Password: Admin123!
Role: admin
```

### Regular Users
```
User 1: user1@test.com / User123! (Balance: 240,000 VND)
User 2: user2@test.com / User123! (Balance: 150,000 VND)
User 3: user3@test.com / User123! (Balance: 80,000 VND)
User 4: user4@test.com / User123! (Balance: 200,000 VND)
User 5: user5@test.com / User123! (Balance: 120,000 VND)
```

### Alternative Admin (Created during testing)
```
Email: admin@test.com
Password: Admin123456
Role: user (not admin)
```

---

## 🚀 Quick Test with cURL

### 1. Health Check
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-25T05:32:21.714Z",
  "uptime": 2759.834
}
```

---

### 2. Login as Admin
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@lunchfund.com",
    "password": "Admin123!"
  }'
```

**Save the token from response!**

Expected response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "admin@lunchfund.com",
      "name": "Admin User",
      "role": "admin",
      "balance": 0
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 3. Login as Regular User
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@test.com",
    "password": "User123!"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 2,
      "email": "user1@test.com",
      "name": "Nguyen Van A",
      "role": "user",
      "balance": 240000
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 4. Get Today's Meal Session
```bash
# Replace <USER_TOKEN> with token from step 3
curl http://localhost:3000/api/orders/today \
  -H "Authorization: Bearer <USER_TOKEN>"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "session": {
      "id": 1,
      "date": "2026-02-25",
      "status": "open",
      "total_participants": 0
    },
    "orders": [],
    "is_joined": false
  }
}
```

---

### 5. Join Today's Session (Order Lunch)
```bash
curl -X POST http://localhost:3000/api/orders/today/join \
  -H "Authorization: Bearer <USER_TOKEN>"
```

Expected response:
```json
{
  "success": true,
  "message": "Đã đặt cơm thành công!"
}
```

---

### 6. Admin: Select 4 Buyers
```bash
# Login as admin first, then use admin token
curl -X POST http://localhost:3000/api/orders/today/select-buyers \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "selected_buyers": [
      {"user_id": 2, "name": "Nguyen Van A"},
      {"user_id": 3, "name": "Tran Thi B"},
      {"user_id": 4, "name": "Le Van C"},
      {"user_id": 5, "name": "Pham Thi D"}
    ]
  }
}
```

---

### 7. Buyer: Submit Payment
```bash
# Use token of one of the selected buyers
curl -X POST http://localhost:3000/api/orders/today/payment \
  -H "Authorization: Bearer <BUYER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "totalAmount": 200000,
    "receiptImage": "https://example.com/receipt.jpg"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Đã submit thanh toán. Đang chờ buyer khác xác nhận...",
  "data": {
    "settlement": {
      "id": 1,
      "session_id": 1,
      "total_amount": 200000,
      "per_person": 50000,
      "status": "pending_confirmation"
    }
  }
}
```

---

## 📱 Testing with Postman/Insomnia

### Setup Collection

1. **Create new collection:** "Lunch Fund API"

2. **Set base URL variable:**
   - Variable: `baseUrl`
   - Value: `http://localhost:3000`

3. **Set auth token variable:**
   - Variable: `authToken`
   - Value: (will be filled after login)

---

### Example Requests

#### Collection Structure:
```
Lunch Fund API/
├── 🔓 Auth/
│   ├── Login Admin
│   ├── Login User1
│   ├── Register New User
│   └── Get Current User
├── 🍱 Orders/
│   ├── Get Today's Session
│   ├── Join Session
│   ├── Leave Session
│   ├── [Admin] Select Buyers
│   ├── [Buyer] Submit Payment
│   └── Get Order History
├── 💰 Transactions/
│   ├── Request Deposit
│   ├── [Admin] Get Pending Deposits
│   ├── [Admin] Approve Deposit
│   └── [Admin] Reject Deposit
└── 📊 Admin/
    ├── Get System Stats
    ├── Get Bank Info
    ├── Update Bank Info
    └── Get All Users
```

---

### Import to Postman

Create a JSON file with this structure:

```json
{
  "info": {
    "name": "Lunch Fund API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    },
    {
      "key": "authToken",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Login Admin",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"admin@lunchfund.com\",\n  \"password\": \"Admin123!\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/auth/login",
          "host": ["{{baseUrl}}"],
          "path": ["api", "auth", "login"]
        }
      }
    }
  ]
}
```

---

## 🔄 Complete Test Workflow

### Scenario: 5 users order lunch, admin selects buyers, buyer pays

```bash
# 1. Login all 5 users and save tokens
TOKEN1=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@test.com","password":"User123!"}' | jq -r '.data.token')

TOKEN2=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user2@test.com","password":"User123!"}' | jq -r '.data.token')

TOKEN3=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user3@test.com","password":"User123!"}' | jq -r '.data.token')

TOKEN4=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user4@test.com","password":"User123!"}' | jq -r '.data.token')

TOKEN5=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user5@test.com","password":"User123!"}' | jq -r '.data.token')

ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lunchfund.com","password":"Admin123!"}' | jq -r '.data.token')

# 2. All users join today's session
curl -X POST http://localhost:3000/api/orders/today/join \
  -H "Authorization: Bearer $TOKEN1"

curl -X POST http://localhost:3000/api/orders/today/join \
  -H "Authorization: Bearer $TOKEN2"

curl -X POST http://localhost:3000/api/orders/today/join \
  -H "Authorization: Bearer $TOKEN3"

curl -X POST http://localhost:3000/api/orders/today/join \
  -H "Authorization: Bearer $TOKEN4"

curl -X POST http://localhost:3000/api/orders/today/join \
  -H "Authorization: Bearer $TOKEN5"

# 3. Admin selects 4 buyers
curl -X POST http://localhost:3000/api/orders/today/select-buyers \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 4. First buyer submits payment
curl -X POST http://localhost:3000/api/orders/today/payment \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{"totalAmount": 250000, "receiptImage": "https://example.com/receipt.jpg"}'

# 5. Check session status
curl http://localhost:3000/api/orders/today \
  -H "Authorization: Bearer $TOKEN1"
```

---

## 🛠️ Backend Management

### View Logs
```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Last 50 lines
docker logs lunch-fund-api --tail 50
```

### Restart Services
```bash
cd /Users/bonnie/.openclaw/workspace-shared/projects/office-lunch-order
docker-compose restart
```

### Stop Services
```bash
docker-compose down
```

### Start Services
```bash
docker-compose up -d
```

### Database Access
```bash
# Via Docker
docker exec -it lunch-fund-db psql -U postgres -d lunch_fund

# View users
docker exec lunch-fund-db psql -U postgres -d lunch_fund -c "SELECT id, name, email, role, balance FROM users;"

# View today's session
docker exec lunch-fund-db psql -U postgres -d lunch_fund -c "SELECT * FROM meal_sessions WHERE date = CURRENT_DATE;"
```

---

## 📊 Check Database

### Via pgAdmin
1. Open: http://localhost:5050
2. Login: admin@lunchfund.com / admin
3. Add server:
   - Host: postgres (or lunch-fund-db)
   - Port: 5432
   - Database: lunch_fund
   - Username: postgres
   - Password: postgres

### Via CLI
```bash
docker exec -it lunch-fund-db psql -U postgres -d lunch_fund

# List tables
\dt

# Check users
SELECT * FROM users;

# Check today's orders
SELECT * FROM meal_orders WHERE session_id IN (
  SELECT id FROM meal_sessions WHERE date = CURRENT_DATE
);
```

---

## ❌ Common Issues & Solutions

### Issue 1: "Connection refused"
**Solution:**
```bash
# Check if services are running
docker-compose ps

# Start services if not running
docker-compose up -d
```

### Issue 2: "Invalid credentials"
**Solution:**
- Double-check email/password
- Test accounts:
  - Admin: admin@lunchfund.com / Admin123!
  - User: user1@test.com / User123!

### Issue 3: "Authorization header missing"
**Solution:**
```bash
# Make sure to include token in header
curl http://localhost:3000/api/orders/today \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Issue 4: Database not initialized
**Solution:**
```bash
# Re-run init script
docker exec lunch-fund-db psql -U postgres -d lunch_fund -f /docker-entrypoint-initdb.d/init.sql
```

---

## 📝 API Documentation

Full API documentation: [API_ENDPOINTS.md](./API_ENDPOINTS.md)

**Quick Links:**
- All 18 endpoints documented
- Request/response examples
- Authentication guide
- Error handling
- User flows

---

## 🎯 Ready to Test!

1. ✅ Backend running on http://localhost:3000
2. ✅ Test accounts ready
3. ✅ Database populated
4. ✅ All endpoints tested

**Start testing now!** 🚀

For issues or questions, contact DevOps team via Telegram group.

---

**Last Updated:** 2026-02-25 12:32 GMT+7  
**Status:** ✅ **READY FOR TESTING**
