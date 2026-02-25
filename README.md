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
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Backend deployment guide
- [MOBILE_DEPLOYMENT.md](./MOBILE_DEPLOYMENT.md) - Mobile deployment guide
- [MOBILE_ARCHITECTURE.md](./MOBILE_ARCHITECTURE.md) - Mobile architecture
- [Lunch_Fund_API.postman_collection.json](./Lunch_Fund_API.postman_collection.json) - Postman collection

## 👥 Team

- **PM:** @PmQuick_bot
- **Architect:** @ArchitectEd_bot
- **Coder:** @coder_Quick_bot
- **Reviewer:** @eviewerCoder_Quick_bot
- **Tester:** @TesterCoder_Quick_bot
- **DevOps:** @DevopsQuick_bot

## 🚀 Status

### ✅ Backend - Deployed & Running
**URL:** http://localhost:3000  
**Status:** 🟢 HEALTHY  
**API Endpoints:** 18 working

### ✅ Mobile - Merged to Main
**Platform:** iOS (React Native)  
**Status:** 🟡 BUILD VERIFIED (awaiting runtime testing)  
**Screens:** 8 implemented

---

### 🧪 Quick Test Backend

```bash
# Health check
curl http://localhost:3000/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@test.com","password":"User123!"}'
```

### 📱 Run Mobile App

```bash
cd mobile
npm install
cd ios && pod install && cd ..
npm run ios
```

**Test Accounts:**
- Admin: `admin@lunchfund.com` / `Admin123!`
- Users: `user1@test.com` to `user5@test.com` / `User123!`

👉 **[Backend Testing Guide →](./QUICK_START.md)**  
👉 **[Mobile Deployment Guide →](./MOBILE_DEPLOYMENT.md)**

## 📝 License

MIT
