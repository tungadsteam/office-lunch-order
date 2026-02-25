# 🍱 Lunch Fund Management System

Hệ thống quản lý quỹ cơm trưa tập thể cho văn phòng.

## 🎯 Tính năng chính

- 🏦 **Quản lý quỹ:** Mỗi người có số dư riêng, nạp tiền qua Admin xác nhận
- 📱 **Đặt cơm hàng ngày:** Real-time danh sách người đặt
- 🎲 **Chọn người đi mua tự động:** 4 người/ngày (không trùng hôm trước)
- 💰 **Quyết toán tự động:** Chia đều hóa đơn cho tất cả người đặt

## 🛠 Tech Stack

- **Mobile:** React Native (iOS)
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Push Notifications:** APNs

## 📁 Cấu trúc Project

```
office-lunch-order/
├── mobile/          # React Native app
├── backend/         # Node.js Express API
├── BRIEF.md         # Chi tiết requirements
└── README.md
```

## 📋 Tài liệu

### 📖 Requirements & Architecture
- [BRIEF.md](./BRIEF.md) - Requirements chi tiết
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Kiến trúc hệ thống

### 🚀 Deployment & Testing
- **[QUICK_START.md](./QUICK_START.md)** - ⚡ Test backend trong 5 phút
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Hướng dẫn test đầy đủ
- [API_ENDPOINTS.md](./API_ENDPOINTS.md) - API documentation (18 endpoints)
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [Lunch_Fund_API.postman_collection.json](./Lunch_Fund_API.postman_collection.json) - Postman collection

## 👥 Team

- **PM:** @PmQuick_bot
- **Architect:** @ArchitectEd_bot
- **Coder:** @coder_Quick_bot
- **Reviewer:** @eviewerCoder_Quick_bot
- **Tester:** @TesterCoder_Quick_bot
- **DevOps:** @DevopsQuick_bot

## 🚀 Status

✅ **Backend Deployed & Ready for Testing!**

**Backend URL:** http://localhost:3000  
**Status:** 🟢 HEALTHY

### 🧪 Quick Test

```bash
# Health check
curl http://localhost:3000/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@test.com","password":"User123!"}'
```

**Test Accounts:**
- Admin: `admin@lunchfund.com` / `Admin123!`
- Users: `user1@test.com` to `user5@test.com` / `User123!`

👉 **[Start Testing Now →](./QUICK_START.md)**

## 📝 License

MIT
