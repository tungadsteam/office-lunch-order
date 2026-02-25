# Quỹ Cơm Trưa - Mobile App (React Native iOS)

Mobile app cho hệ thống quản lý quỹ cơm trưa tập thể.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Xcode 15+ (cho iOS)
- CocoaPods
- React Native CLI

### Setup

```bash
# Install dependencies
npm install

# Install iOS pods
cd ios && pod install && cd ..

# Start Metro bundler
npm start

# Run on iOS simulator
npm run ios
```

### Nếu chưa có ios/ folder (React Native init):

```bash
# Tạo React Native project (chạy 1 lần)
npx react-native@latest init LunchFundApp --directory . --skip-install

# Sau đó install dependencies
npm install
cd ios && pod install && cd ..
```

## 📱 Screens

### Authentication
- **Login** - Đăng nhập bằng email/password
- **Register** - Đăng ký tài khoản mới

### User Screens
- **Dashboard** - Trang chủ với số dư, đặt cơm hôm nay, admin actions
- **Order Details** - Chi tiết phiên đặt cơm
- **Payment** - Nhập hóa đơn (cho người đi mua)
- **Deposit** - Nạp tiền vào quỹ

### Admin Screens
- **Admin Dashboard** - Thống kê hệ thống
- **Approvals** - Duyệt/từ chối yêu cầu nạp tiền

## 🔗 API Integration

App kết nối với backend API:
- **Base URL:** `http://localhost:3000/api` (development)
- **Auth:** JWT token stored in AsyncStorage
- **Auto-refresh:** Polling mỗi 10 giây cho real-time updates

### Endpoints used:
- Auth: login, register, me
- Orders: today, join, leave, select-buyers, payment, history
- Transactions: deposit, pending, approve, history
- Admin: stats, bank-info, users

## 🧪 Test Accounts

**Admin:**
- Email: admin@lunchfund.com
- Password: Admin123!

**Users:**
- user1@test.com / User123!
- user2@test.com / User123!
- user3@test.com / User123!
- user4@test.com / User123!
- user5@test.com / User123!

## 📁 Project Structure

```
mobile/
├── App.tsx                    # Entry point
├── src/
│   ├── api/                   # API client
│   │   ├── axios.ts           # Axios config + interceptors
│   │   ├── auth.ts            # Auth endpoints
│   │   ├── orders.ts          # Order endpoints
│   │   ├── transactions.ts    # Transaction endpoints
│   │   └── admin.ts           # Admin endpoints
│   ├── components/            # Reusable UI components
│   │   ├── Button.tsx         # Custom button
│   │   ├── Card.tsx           # Card container
│   │   ├── Input.tsx          # Form input
│   │   └── UserAvatar.tsx     # User avatar with initials
│   ├── screens/               # App screens
│   │   ├── Auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── Home/
│   │   │   ├── DashboardScreen.tsx
│   │   │   └── OrderDetailsScreen.tsx
│   │   ├── Payment/
│   │   │   └── PaymentScreen.tsx
│   │   ├── Deposit/
│   │   │   └── DepositScreen.tsx
│   │   └── Admin/
│   │       ├── AdminDashboard.tsx
│   │       └── ApprovalsScreen.tsx
│   ├── context/
│   │   └── AuthContext.tsx     # Auth state management
│   ├── navigation/
│   │   ├── AppNavigator.tsx   # Main app navigation
│   │   └── AuthNavigator.tsx  # Auth flow navigation
│   ├── utils/
│   │   ├── constants.ts       # Colors, fonts, spacing
│   │   └── storage.ts         # AsyncStorage helpers
│   └── types/
│       └── index.ts           # TypeScript interfaces
├── package.json
├── tsconfig.json
├── babel.config.js
└── metro.config.js
```

## 🎨 Design

- **Colors:** iOS Blue (#007AFF) primary
- **Style:** Clean, modern, iOS-native feel
- **Components:** Custom Button, Card, Input, Avatar
- **Navigation:** Stack-based with @react-navigation

## 🔧 Configuration

Thay đổi API URL trong `src/utils/constants.ts`:

```typescript
export const API_BASE_URL = 'http://localhost:3000/api';
// Production: export const API_BASE_URL = 'https://api.lunch-fund.com/api';
```

## 📝 Features

### P0 (Must Have) ✅
- [x] Login/Register
- [x] Dashboard với số dư
- [x] Đặt cơm / Hủy đặt
- [x] Xem danh sách người đã đặt
- [x] Nhập hóa đơn (buyer)
- [x] Admin: Chọn 4 người

### P1 (Nice to Have) ✅
- [x] Deposit flow (User nạp tiền)
- [x] Admin approve deposits
- [x] Order details screen

### P2 (Optional)
- [ ] Upload ảnh hóa đơn
- [ ] Real-time updates (WebSocket)
- [ ] Push notifications
- [ ] Dark mode
- [ ] Animations
- [ ] Transaction history screen
- [ ] Order history screen

## 📦 Dependencies

- **react-native** - Mobile framework
- **@react-navigation** - Navigation
- **axios** - HTTP client
- **@react-native-async-storage** - Local storage
- **react-native-vector-icons** - Icons

## 📝 License

MIT
