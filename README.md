# 📦 Office Lunch Order App

App đặt cơm văn phòng với React Native (iOS) + Backend

## 📁 Cấu trúc Project

```
office-lunch-order/
├── OfficeLunchApp/          # React Native iOS app
├── backend/                 # Backend API (Node.js/Express hoặc Python/FastAPI)
└── README.md
```

## 🎯 Tính năng chính

### Mobile App (React Native iOS)
- Xem menu đặt cơm hàng ngày
- Đặt cơm theo suất
- Xem lịch sử đặt cơm
- Thông báo nhắc nhở
- Profile người dùng

### Backend
- API quản lý menu
- API đặt cơm
- Lưu trữ lịch sử đơn hàng
- Authentication (JWT)
- Database (PostgreSQL/MongoDB)

## 🛠 Tech Stack

**Frontend:**
- React Native 0.84
- TypeScript
- React Navigation
- Async Storage
- Push Notifications (APNs)

**Backend:**
- TBD (Node.js/Python - do Architect quyết định)
- Docker
- PostgreSQL/MongoDB
- REST API

## 📋 Milestones

1. **Setup & Architecture** - Thiết kế hệ thống
2. **Backend API** - Phát triển backend
3. **Mobile UI** - Giao diện app
4. **Integration** - Tích hợp frontend-backend
5. **Testing** - Test toàn bộ
6. **Deployment** - Deploy production

## 🚀 Quick Start

### Mobile App
```bash
cd OfficeLunchApp
npm install
cd ios && pod install && cd ..
npx react-native run-ios
```

### Backend
```bash
cd backend
# TBD - chờ Architect thiết kế
```

## 👥 Team

- **PM:** @PmQuick_bot
- **Architect:** @ArchitectEd_bot
- **Coder:** @coder_Quick_bot
- **Reviewer:** @eviewerCoder_Quick_bot
- **Tester:** @TesterCoder_Quick_bot
- **DevOps:** @DevopsQuick_bot

## 📝 License

MIT
