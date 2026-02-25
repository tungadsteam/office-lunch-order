# Lunch Fund Management - Backend API

Backend API cho hệ thống quản lý quỹ cơm trưa tập thể.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- npm hoặc yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env với thông tin database của bạn
```

### Database Setup

```bash
# Tạo database
createdb lunch_fund

# Hoặc dùng psql
psql -U postgres -c "CREATE DATABASE lunch_fund;"

# Import schema
psql -U postgres -d lunch_fund -f db/init.sql
```

### Run Development Server

```bash
npm run dev
```

Server sẽ chạy tại: http://localhost:3000

### Run Production Server

```bash
npm start
```

## 🐳 Docker

### Chạy với Docker Compose (Recommended)

```bash
# Từ root folder (parent của backend/)
docker-compose up -d

# Check logs
docker-compose logs -f backend

# Stop
docker-compose down
```

Services:
- Backend API: http://localhost:3000
- PostgreSQL: localhost:5432
- pgAdmin: http://localhost:5050

### Build Docker Image

```bash
docker build -t lunch-fund-backend .
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký user mới
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user hiện tại

### Orders
- `GET /api/orders/today` - Lấy session hôm nay
- `POST /api/orders/today/join` - Đặt cơm hôm nay
- `DELETE /api/orders/today/leave` - Hủy đặt cơm
- `POST /api/orders/today/select-buyers` - Chọn 4 người đi mua [Admin]
- `POST /api/orders/today/payment` - Submit thanh toán [Buyer]
- `GET /api/orders/history` - Lịch sử đặt cơm
- `GET /api/orders/:id` - Chi tiết session

### Transactions
- `POST /api/transactions/deposit` - Tạo yêu cầu nạp tiền
- `GET /api/transactions/pending` - Danh sách deposit pending [Admin]
- `PUT /api/transactions/:id/approve` - Duyệt deposit [Admin]
- `PUT /api/transactions/:id/reject` - Từ chối deposit [Admin]
- `GET /api/transactions/history` - Lịch sử giao dịch

### Admin
- `GET /api/admin/stats` - Thống kê hệ thống [Admin]
- `GET /api/admin/bank-info` - Thông tin tài khoản ngân hàng
- `PUT /api/admin/bank-info` - Cập nhật thông tin ngân hàng [Admin]
- `GET /api/admin/users` - Danh sách users [Admin]
- `PUT /api/admin/users/:id/balance` - Điều chỉnh số dư [Admin]

## 🔐 Authentication

Tất cả endpoints (trừ /auth/register, /auth/login, /health) đều yêu cầu JWT token:

```
Authorization: Bearer <jwt_token>
```

## 🧪 Testing

### Test Accounts

**Admin:**
- Email: admin@lunchfund.com
- Password: Admin123!

**Users:**
- Email: user1@test.com → user5@test.com
- Password: User123!

### Example: Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@lunchfund.com", "password": "Admin123!"}'
```

### Example: Get Today's Orders

```bash
curl http://localhost:3000/api/orders/today \
  -H "Authorization: Bearer <your_token>"
```

## 📁 Project Structure

```
backend/
├── db/
│   └── init.sql              # Database schema
├── src/
│   ├── config/
│   │   └── database.js       # PostgreSQL connection
│   ├── middleware/
│   │   ├── auth.js           # JWT authentication
│   │   ├── errorHandler.js   # Error handling
│   │   └── validate.js       # Input validation
│   ├── routes/
│   │   ├── auth.js
│   │   ├── orders.js
│   │   ├── transactions.js
│   │   └── admin.js
│   ├── controllers/
│   │   ├── AuthController.js
│   │   ├── OrderController.js
│   │   ├── TransactionController.js
│   │   └── AdminController.js
│   ├── services/
│   │   ├── BuyerSelectionService.js   # Algorithm 1: Fair rotation
│   │   ├── SettlementService.js       # Algorithm 2: Atomic settlement
│   │   ├── NotificationService.js     # Push notifications
│   │   └── TransactionService.js      # Deposit/approve/reject
│   └── app.js                # Express app
├── server.js                 # Server entry point
├── Dockerfile
├── .env
└── package.json
```

## 🔧 Environment Variables

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lunch_fund
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
CRON_ENABLED=true
CRON_TIMEZONE=Asia/Ho_Chi_Minh
```

## 🎯 Core Features

### 1. Buyer Selection Algorithm
Chọn 4 người đi mua mỗi ngày sao cho:
- Fair rotation (mỗi người được chọn đều nhau)
- Không trùng 4 người hôm trước
- Tự động reset khi tất cả đã đi hết 1 vòng

### 2. Settlement Algorithm
Quyết toán tự động với atomic transaction:
- +tiền cho người trả tiền (payer)
- -tiền cho tất cả người đặt (bao gồm payer)
- Rollback nếu có lỗi
- Race condition protection với pessimistic locking

### 3. Deposit Workflow
- User tạo yêu cầu nạp tiền (status: pending)
- Admin duyệt → +tiền vào balance
- Admin từ chối → notify user

## 📦 Dependencies

- **express** - Web framework
- **pg** - PostgreSQL client
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **express-validator** - Input validation
- **cors** - CORS handling
- **helmet** - Security headers
- **moment** - Date/time handling
- **firebase-admin** - Push notifications
- **node-cron** - Scheduled jobs

## 🛠️ Maintenance

### Backup Database

```bash
pg_dump -U postgres lunch_fund > backup.sql
```

### Restore Database

```bash
psql -U postgres lunch_fund < backup.sql
```

### Check Logs

```bash
# Docker
docker-compose logs -f backend

# PM2 (if using)
pm2 logs
```

## 📝 License

MIT

## 👥 Contributors

- Coder (Backend Developer)
