# 📱 MOBILE ARCHITECTURE - Lunch Fund iOS App

## 🎯 Tổng quan

**Platform:** iOS (React Native)  
**Language:** TypeScript  
**State Management:** Context API + AsyncStorage  
**Navigation:** React Navigation v6  
**UI Framework:** Custom components + React Native Paper (optional)  

**Key Features:**
- 🔐 Login/Register với JWT
- 💰 Dashboard hiển thị balance + order status
- 🍱 Order Today (đặt cơm real-time)
- 💵 Payment submission (cho buyers)
- 👤 Profile management
- 🔧 Admin dashboard

---

## 📂 Project Structure

```
office-lunch-order/
├── mobile/
│   ├── src/
│   │   ├── screens/
│   │   │   ├── auth/
│   │   │   │   ├── LoginScreen.tsx
│   │   │   │   └── RegisterScreen.tsx
│   │   │   ├── main/
│   │   │   │   ├── DashboardScreen.tsx
│   │   │   │   ├── OrderTodayScreen.tsx
│   │   │   │   ├── PaymentScreen.tsx
│   │   │   │   ├── HistoryScreen.tsx
│   │   │   │   ├── ProfileScreen.tsx
│   │   │   │   └── DepositScreen.tsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboardScreen.tsx
│   │   │       ├── PendingDepositsScreen.tsx
│   │   │       └── UsersListScreen.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Avatar.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   └── LoadingSpinner.tsx
│   │   │   ├── order/
│   │   │   │   ├── OrderCard.tsx
│   │   │   │   ├── ParticipantsList.tsx
│   │   │   │   └── BuyerBadge.tsx
│   │   │   └── dashboard/
│   │   │       ├── BalanceCard.tsx
│   │   │       ├── QuickActions.tsx
│   │   │       └── TodayOrderSummary.tsx
│   │   │
│   │   ├── navigation/
│   │   │   ├── AppNavigator.tsx          # Root navigator
│   │   │   ├── AuthNavigator.tsx         # Auth stack
│   │   │   ├── MainNavigator.tsx         # Main tab/drawer
│   │   │   └── AdminNavigator.tsx        # Admin stack
│   │   │
│   │   ├── api/
│   │   │   ├── client.ts                 # Axios instance + interceptors
│   │   │   ├── endpoints.ts              # API endpoints constants
│   │   │   └── services/
│   │   │       ├── authService.ts
│   │   │       ├── orderService.ts
│   │   │       ├── transactionService.ts
│   │   │       ├── userService.ts
│   │   │       └── adminService.ts
│   │   │
│   │   ├── context/
│   │   │   ├── AuthContext.tsx           # User, token, login, logout
│   │   │   └── OrderContext.tsx          # Today's order state (optional)
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useOrder.ts
│   │   │   └── useApi.ts                 # Generic API hook
│   │   │
│   │   ├── types/
│   │   │   ├── user.types.ts
│   │   │   ├── order.types.ts
│   │   │   ├── transaction.types.ts
│   │   │   ├── api.types.ts
│   │   │   └── navigation.types.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── storage.ts                # AsyncStorage wrapper
│   │   │   ├── formatters.ts             # Currency, date formatters
│   │   │   ├── validators.ts             # Input validation
│   │   │   └── constants.ts              # App constants
│   │   │
│   │   └── styles/
│   │       ├── colors.ts
│   │       ├── typography.ts
│   │       └── spacing.ts
│   │
│   ├── ios/                              # iOS native code (Xcode project)
│   ├── android/                          # (Skip for now)
│   ├── App.tsx                           # Root component
│   ├── index.js                          # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
└── (backend, docs...)
```

---

## 🎨 Screens Design

### 📱 Auth Screens

#### 1. LoginScreen.tsx

**Layout:**
```
┌─────────────────────────┐
│     [App Logo/Icon]     │
│                         │
│   Lunch Fund Manager    │
│                         │
│  ┌───────────────────┐  │
│  │ Email             │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ Password          │  │
│  └───────────────────┘  │
│                         │
│  [  Login Button   ]    │
│                         │
│  Chưa có tài khoản?     │
│     Đăng ký ngay        │
│                         │
└─────────────────────────┘
```

**Features:**
- Email input (validate email format)
- Password input (secure text entry)
- Login button (disable khi loading)
- Link to Register screen
- Error message display (alert hoặc text dưới inputs)
- Loading spinner khi đang login

**API Call:**
```typescript
POST /auth/login
Body: { email, password, fcm_token? }
Response: { success, data: { user, token } }
```

**State:**
- email: string
- password: string
- loading: boolean
- error: string | null

**Actions:**
- onLogin() → call authService.login() → save token → navigate to Main

---

#### 2. RegisterScreen.tsx

**Layout:**
```
┌─────────────────────────┐
│     Đăng ký tài khoản   │
│                         │
│  ┌───────────────────┐  │
│  │ Họ tên            │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ Email             │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ Số điện thoại     │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ Mật khẩu          │  │
│  └───────────────────┘  │
│                         │
│  [  Đăng ký  ]          │
│                         │
│  Đã có tài khoản?       │
│     Đăng nhập           │
│                         │
└─────────────────────────┘
```

**Features:**
- Name, email, phone, password inputs
- Validation (email format, password min 6 chars)
- Register button
- Link back to Login
- Success → Auto login → Navigate to Main

**API Call:**
```typescript
POST /auth/register
Body: { email, password, name, phone }
Response: { success, data: { user, token } }
```

---

### 📱 Main Screens

#### 3. DashboardScreen.tsx

**Layout:**
```
┌─────────────────────────┐
│ ☰  Dashboard         👤 │
├─────────────────────────┤
│  Xin chào, Nguyen Van A │
│                         │
│ ┌─────────────────────┐ │
│ │  💰 Số dư           │ │
│ │  150,000đ           │ │
│ │  [Nạp tiền]         │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │  🍱 Cơm hôm nay     │ │
│ │  12 người đã đặt    │ │
│ │  [Xem chi tiết]     │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │  📊 Thống kê tháng  │ │
│ │  Chi: 450,000đ      │ │
│ │  Đi mua: 3 lần      │ │
│ └─────────────────────┘ │
│                         │
└─────────────────────────┘
```

**Components:**
- BalanceCard: Hiển thị số dư + nút nạp tiền
- TodayOrderSummary: Số người đặt + status + nút xem chi tiết
- QuickActions: Shortcuts (nạp tiền, lịch sử, profile)

**Features:**
- Hiển thị user.name, user.balance
- Nút "Nạp tiền" → Navigate to DepositScreen
- Card "Cơm hôm nay" → Navigate to OrderTodayScreen
- Card "Lịch sử" → Navigate to HistoryScreen

**API Calls:**
```typescript
GET /auth/me → Get user info
GET /orders/today → Get today's order summary
```

---

#### 4. OrderTodayScreen.tsx

**Layout:**
```
┌─────────────────────────┐
│ ←  Cơm hôm nay          │
├─────────────────────────┤
│  Thứ 6, 24/02/2025      │
│  15 người đã đặt        │
│                         │
│ ┌─────────────────────┐ │
│ │  🛒 Biệt đội đi mua │ │
│ │  • Nguyen Van A     │ │
│ │  • Tran Thi B       │ │
│ │  • Le Van C         │ │
│ │  • Pham Thi D       │ │
│ └─────────────────────┘ │
│                         │
│  Danh sách đặt cơm:     │
│                         │
│  [Avatar] Nguyen Van A  │
│  [Avatar] Tran Thi B    │
│  [Avatar] Le Van C      │
│  ...                    │
│  (15 người)             │
│                         │
│ ┌─────────────────────┐ │
│ │  [  Đặt cơm  ]      │ │
│ └─────────────────────┘ │
│                         │
└─────────────────────────┘
```

**States:**
- User đã đặt → Hiển thị nút "Hủy đặt cơm" (màu đỏ)
- User chưa đặt → Hiển thị nút "Đặt cơm" (màu xanh)
- User là buyer → Hiển thị badge "🛒 Bạn đi mua hôm nay" + nút "Nhập hóa đơn"

**Features:**
- Real-time participants list (WebSocket optional)
- Button "Đặt cơm" / "Hủy đặt cơm"
- Hiển thị 4 buyers nếu đã chọn
- Nếu user là buyer → Show "Nhập hóa đơn" button

**API Calls:**
```typescript
GET /orders/today → Get session info
POST /orders/today/join → User đặt cơm
DELETE /orders/today/leave → User hủy đặt
```

**WebSocket (Optional):**
```typescript
socket.on('order:joined', (data) => {
  // Update participants list
});
```

---

#### 5. PaymentScreen.tsx

**Conditional:** Chỉ hiển thị nếu user là 1 trong 4 buyers

**Layout:**
```
┌─────────────────────────┐
│ ←  Nhập hóa đơn         │
├─────────────────────────┤
│  Cơm hôm nay            │
│  15 người đã đặt        │
│                         │
│  Tổng tiền hóa đơn:     │
│                         │
│  ┌───────────────────┐  │
│  │ 500000            │  │
│  └───────────────────┘  │
│  (đơn vị: đồng)         │
│                         │
│  Ghi chú (optional):    │
│  ┌───────────────────┐  │
│  │ Quán Cơm Tấm 37   │  │
│  └───────────────────┘  │
│                         │
│  [ Upload ảnh hóa đơn ] │
│  (optional)             │
│                         │
│ ┌─────────────────────┐ │
│ │  [ Xác nhận ]       │ │
│ └─────────────────────┘ │
│                         │
│  ⚠️ Sau khi xác nhận:   │
│  • Bạn +500,000đ        │
│  • 15 người -33,333đ    │
│                         │
└─────────────────────────┘
```

**Features:**
- Input amount (numeric keyboard)
- Input note (optional)
- Upload image (optional, use ImagePicker)
- Button "Xác nhận" → Show confirmation alert
- Success → Navigate back + show success message

**API Call:**
```typescript
POST /orders/today/payment
Body: { total_bill, note?, bill_image_url? }
Response: { success, data: { settlement_summary } }
```

**Validation:**
- Amount > 0
- Confirmation alert: "Xác nhận thanh toán 500,000đ?"

---

#### 6. HistoryScreen.tsx

**Layout:**
```
┌─────────────────────────┐
│ ←  Lịch sử              │
├─────────────────────────┤
│  Tháng 2/2025           │
│  Tổng chi: 450,000đ     │
│                         │
│ ┌─────────────────────┐ │
│ │ 24/02 - Thứ 6       │ │
│ │ 15 người • 33,333đ  │ │
│ │ Trạng thái: ✅      │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ 23/02 - Thứ 5       │ │
│ │ 12 người • 35,000đ  │ │
│ │ Trạng thái: ✅      │ │
│ └─────────────────────┘ │
│                         │
│  (Load more...)         │
│                         │
└─────────────────────────┘
```

**Features:**
- FlatList với pagination
- Mỗi item: Ngày + Số người + Số tiền + Status
- Tap vào item → Navigate to Detail (session detail)

**API Call:**
```typescript
GET /orders/history?limit=30&offset=0
Response: { success, data: { sessions, total } }
```

---

#### 7. ProfileScreen.tsx

**Layout:**
```
┌─────────────────────────┐
│ ←  Tài khoản            │
├─────────────────────────┤
│     [Avatar]            │
│   Nguyen Van A          │
│   user@example.com      │
│                         │
│ ┌─────────────────────┐ │
│ │  💰 Số dư           │ │
│ │  150,000đ           │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │  📊 Thống kê        │ │
│ │  Tổng chi: 1.2M     │ │
│ │  Đi mua: 12 lần     │ │
│ └─────────────────────┘ │
│                         │
│  [ Lịch sử giao dịch ]  │
│  [ Cài đặt ]            │
│  [ Đăng xuất ]          │
│                         │
└─────────────────────────┘
```

**Features:**
- Hiển thị user info (name, email, balance, stats)
- Button "Lịch sử giao dịch" → Navigate to TransactionHistoryScreen
- Button "Đăng xuất" → Confirm alert → Logout → Clear token → Navigate to Login

**API Call:**
```typescript
GET /auth/me → Get user data
```

---

#### 8. DepositScreen.tsx

**Layout:**
```
┌─────────────────────────┐
│ ←  Nạp tiền             │
├─────────────────────────┤
│  Thông tin chuyển khoản:│
│                         │
│ ┌─────────────────────┐ │
│ │ Ngân hàng:          │ │
│ │ Vietcombank         │ │
│ │                     │ │
│ │ Số TK: 1234567890   │ │
│ │ [ Copy ]            │ │
│ │                     │ │
│ │ Chủ TK: NGUYEN VAN A│ │
│ └─────────────────────┘ │
│                         │
│  Hướng dẫn:             │
│  1. Chuyển khoản        │
│  2. Nhập số tiền dưới   │
│  3. Chờ admin xác nhận  │
│                         │
│  Số tiền đã chuyển:     │
│  ┌───────────────────┐  │
│  │ 500000            │  │
│  └───────────────────┘  │
│                         │
│  Ghi chú (optional):    │
│  ┌───────────────────┐  │
│  │ Nạp tiền tháng 2  │  │
│  └───────────────────┘  │
│                         │
│ ┌─────────────────────┐ │
│ │  [ Tôi đã nạp tiền ]│ │
│ └─────────────────────┘ │
│                         │
│  Lịch sử nạp tiền:      │
│  • 500k - Pending       │
│  • 200k - Approved ✅   │
│                         │
└─────────────────────────┘
```

**Features:**
- Hiển thị bank info (GET /admin/bank-info)
- Button copy số TK
- Input amount
- Button "Tôi đã nạp tiền" → POST /transactions/deposit
- Hiển thị pending/approved deposits

**API Calls:**
```typescript
GET /admin/bank-info → Get bank account
POST /transactions/deposit → Submit deposit request
GET /transactions/history?type=deposit → Get deposit history
```

---

### 🔧 Admin Screens

#### 9. AdminDashboardScreen.tsx

**Layout:**
```
┌─────────────────────────┐
│ ☰  Admin Panel       👤 │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │  📊 Thống kê        │ │
│ │  Users: 25          │ │
│ │  Tổng quỹ: 3.5M    │ │
│ │  Pending: 3 yêu cầu │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │  [ Duyệt nạp tiền ] │ │
│ │  Badge: 3           │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │  [ Chọn người mua ] │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │  [ Quản lý users ]  │ │
│ └─────────────────────┘ │
│                         │
└─────────────────────────┘
```

**Features:**
- Stats overview (GET /admin/stats)
- Button "Duyệt nạp tiền" → Navigate to PendingDepositsScreen
- Button "Chọn người mua" → Call POST /orders/today/select-buyers
- Button "Quản lý users" → Navigate to UsersListScreen

---

#### 10. PendingDepositsScreen.tsx

**Layout:**
```
┌─────────────────────────┐
│ ←  Duyệt nạp tiền       │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ Nguyen Van A        │ │
│ │ 500,000đ            │ │
│ │ "Nạp tiền tháng 2"  │ │
│ │ 24/02 10:30         │ │
│ │ [ Duyệt ] [ Từ chối]│ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ Tran Thi B          │ │
│ │ 200,000đ            │ │
│ │ ...                 │ │
│ └─────────────────────┘ │
│                         │
└─────────────────────────┘
```

**Features:**
- FlatList pending deposits (GET /transactions/pending)
- Buttons "Duyệt" → PUT /transactions/:id/approve
- Button "Từ chối" → PUT /transactions/:id/reject (not in API yet, skip)

---

## 🧭 Navigation Flow

### Navigation Stack

```typescript
// navigation/AppNavigator.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { useAuth } from '../hooks/useAuth';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { user } = useAuth();
  
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### Auth Navigator

```typescript
// navigation/AuthNavigator.tsx
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

const Stack = createStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
```

### Main Navigator (Tab Navigator)

```typescript
// navigation/MainNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/main/DashboardScreen';
import OrderTodayScreen from '../screens/main/OrderTodayScreen';
import HistoryScreen from '../screens/main/HistoryScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import AdminNavigator from './AdminNavigator';
import { useAuth } from '../hooks/useAuth';

const Tab = createBottomTabNavigator();

export default function MainNavigator() {
  const { user } = useAuth();
  
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Order" component={OrderTodayScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      {user?.role === 'admin' && (
        <Tab.Screen name="Admin" component={AdminNavigator} />
      )}
    </Tab.Navigator>
  );
}
```

---

## 🔌 API Integration

### Axios Client Setup

```typescript
// api/client.ts
import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/constants';

const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL, // http://localhost:3000/api
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Inject token
client.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle errors
client.interceptors.response.use(
  (response) => response.data, // Return data directly
  (error) => {
    if (error.response?.status === 401) {
      // Token expired → Logout
      AsyncStorage.removeItem('auth_token');
      // Navigate to Login (need NavigationService)
    }
    
    const message = error.response?.data?.message || 'Network error';
    return Promise.reject(new Error(message));
  }
);

export default client;
```

### API Services

```typescript
// api/services/authService.ts
import client from '../client';
import { LoginRequest, LoginResponse, RegisterRequest } from '../../types/api.types';

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return client.post('/auth/login', data);
  },
  
  register: async (data: RegisterRequest): Promise<LoginResponse> => {
    return client.post('/auth/register', data);
  },
  
  getMe: async () => {
    return client.get('/auth/me');
  },
};
```

```typescript
// api/services/orderService.ts
import client from '../client';

export const orderService = {
  getToday: async () => {
    return client.get('/orders/today');
  },
  
  join: async () => {
    return client.post('/orders/today/join');
  },
  
  leave: async () => {
    return client.delete('/orders/today/leave');
  },
  
  submitPayment: async (data: { total_bill: number; note?: string; bill_image_url?: string }) => {
    return client.post('/orders/today/payment', data);
  },
  
  getHistory: async (limit = 30, offset = 0) => {
    return client.get(`/orders/history?limit=${limit}&offset=${offset}`);
  },
};
```

```typescript
// api/services/transactionService.ts
import client from '../client';

export const transactionService = {
  deposit: async (amount: number, note?: string) => {
    return client.post('/transactions/deposit', { amount, note });
  },
  
  getHistory: async (type?: string) => {
    const params = type ? `?type=${type}` : '';
    return client.get(`/transactions/history${params}`);
  },
};
```

---

## 🧠 State Management

### AuthContext

```typescript
// context/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../api/services/authService';
import { User } from '../types/user.types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      if (storedToken) {
        setToken(storedToken);
        const userData = await authService.getMe();
        setUser(userData.data);
      }
    } catch (error) {
      console.error('Load auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    const { token: newToken, user: newUser } = response.data;
    
    await AsyncStorage.setItem('auth_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    const response = await authService.register({ name, email, password, phone });
    const { token: newToken, user: newUser } = response.data;
    
    await AsyncStorage.setItem('auth_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### useAuth Hook

```typescript
// hooks/useAuth.ts
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

## 🎨 UI/UX Guidelines

### Design System

**Color Palette:**
```typescript
// styles/colors.ts
export const colors = {
  primary: '#007AFF',      // iOS blue
  secondary: '#5856D6',    // iOS purple
  success: '#34C759',      // Green
  warning: '#FF9500',      // Orange
  danger: '#FF3B30',       // Red
  
  background: '#F2F2F7',   // Light gray
  card: '#FFFFFF',
  border: '#E5E5EA',
  
  text: {
    primary: '#000000',
    secondary: '#8E8E93',
    tertiary: '#C7C7CC',
  },
};
```

**Typography:**
```typescript
// styles/typography.ts
export const typography = {
  h1: { fontSize: 34, fontWeight: '700', lineHeight: 41 },
  h2: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  h3: { fontSize: 22, fontWeight: '600', lineHeight: 28 },
  body: { fontSize: 17, fontWeight: '400', lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
};
```

**Spacing:**
```typescript
// styles/spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
```

### Components Design

**Button Component:**
```typescript
// components/common/Button.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../../styles/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
}

export const Button = ({ title, onPress, variant = 'primary', loading, disabled }: ButtonProps) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        (loading || disabled) && styles.disabled,
      ]}
      onPress={onPress}
      disabled={loading || disabled}
    >
      {loading ? (
        <ActivityIndicator color="#FFF" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.secondary },
  danger: { backgroundColor: colors.danger },
  disabled: { opacity: 0.5 },
  text: { color: '#FFF', fontSize: 17, fontWeight: '600' },
});
```

**Card Component:**
```typescript
// components/common/Card.tsx
import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '../../styles';

export const Card = ({ children }: { children: ReactNode }) => {
  return <View style={styles.card}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
});
```

---

## 📦 Dependencies

### package.json

```json
{
  "name": "LunchFundApp",
  "version": "1.0.0",
  "scripts": {
    "start": "react-native start",
    "ios": "react-native run-ios",
    "test": "jest",
    "lint": "eslint ."
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-native": "^0.73.0",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/stack": "^6.3.20",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "react-native-screens": "^3.29.0",
    "react-native-safe-area-context": "^4.8.2",
    "react-native-gesture-handler": "^2.14.1",
    "axios": "^1.6.5",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "react-native-vector-icons": "^10.0.3"
  },
  "devDependencies": {
    "@types/react": "^18.2.48",
    "@types/react-native": "^0.73.0",
    "typescript": "^5.3.3",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "eslint": "^8.56.0",
    "jest": "^29.7.0",
    "@testing-library/react-native": "^12.4.3"
  }
}
```

---

## ⚙️ Configuration

### .env.example

```env
API_BASE_URL=http://localhost:3000/api
API_TIMEOUT=10000
```

### tsconfig.json

```json
{
  "extends": "@react-native/typescript-config/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "target": "esnext",
    "module": "commonjs",
    "lib": ["es2017"],
    "jsx": "react-native",
    "noEmit": true,
    "isolatedModules": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "baseUrl": "./src",
    "paths": {
      "@components/*": ["components/*"],
      "@screens/*": ["screens/*"],
      "@api/*": ["api/*"],
      "@utils/*": ["utils/*"],
      "@types/*": ["types/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.spec.ts"]
}
```

---

## 🧪 Testing Strategy

### Unit Tests (Optional for Phase 1)

**Test API services:**
```typescript
// __tests__/api/authService.test.ts
import { authService } from '../../src/api/services/authService';

describe('authService', () => {
  it('should login successfully', async () => {
    const result = await authService.login({
      email: 'test@example.com',
      password: 'password123',
    });
    
    expect(result.success).toBe(true);
    expect(result.data.token).toBeDefined();
  });
});
```

---

## 📱 Setup Instructions

### 1. Initialize React Native Project

```bash
cd office-lunch-order
npx react-native@latest init LunchFundApp --template react-native-template-typescript
mv LunchFundApp mobile
cd mobile
```

### 2. Install Dependencies

```bash
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context react-native-gesture-handler
npm install axios @react-native-async-storage/async-storage
npm install react-native-vector-icons

# Link native dependencies (iOS)
cd ios && pod install && cd ..
```

### 3. Setup Project Structure

```bash
mkdir -p src/{screens/{auth,main,admin},components/{common,order,dashboard},navigation,api/services,context,hooks,types,utils,styles}
```

### 4. Configure Entry Point

```typescript
// App.tsx
import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
```

### 5. Run App

```bash
# Terminal 1: Start Metro bundler
npm start

# Terminal 2: Run iOS
npm run ios
```

---

## 🚀 Development Workflow

### Phase 1: Core Features (4-6 hours)

**Step 1: Setup (30 mins)**
- ✅ Initialize project
- ✅ Install dependencies
- ✅ Create folder structure

**Step 2: API Layer (1 hour)**
- ✅ Setup Axios client
- ✅ Create authService, orderService, transactionService
- ✅ Types definitions

**Step 3: State Management (30 mins)**
- ✅ AuthContext
- ✅ useAuth hook

**Step 4: Navigation (30 mins)**
- ✅ AppNavigator
- ✅ AuthNavigator
- ✅ MainNavigator

**Step 5: Auth Screens (1 hour)**
- ✅ LoginScreen
- ✅ RegisterScreen

**Step 6: Main Screens (2 hours)**
- ✅ DashboardScreen
- ✅ OrderTodayScreen
- ✅ ProfileScreen

**Step 7: Test & Debug (30 mins)**
- ✅ Test login flow
- ✅ Test order flow
- ✅ Fix bugs

---

## ✅ Acceptance Criteria

**Must Have (Phase 1):**
- [ ] Login/Register work với backend API
- [ ] Dashboard hiển thị balance, today's order summary
- [ ] OrderTodayScreen hiển thị participants, button đặt/hủy
- [ ] API integration work (auth, orders)
- [ ] Navigation flow correct
- [ ] iOS app chạy được trên simulator

**Nice to Have (Phase 2):**
- [ ] PaymentScreen cho buyers
- [ ] DepositScreen
- [ ] Admin screens
- [ ] Real-time updates (WebSocket)
- [ ] Push notifications

---

## 🔒 Security Considerations

1. **Token Storage:** AsyncStorage (không phải Keychain, trade-off simplicity vs security)
2. **Input Validation:** Validate email, password trước khi gửi API
3. **Error Handling:** Không expose sensitive info trong error messages
4. **HTTPS:** Production phải dùng HTTPS (development localhost ok)

---

## 📝 Notes for Coder

### Coding Standards:
- **TypeScript strict mode:** Bật strict trong tsconfig.json
- **Naming conventions:** 
  - Components: PascalCase (LoginScreen.tsx)
  - Hooks: camelCase with "use" prefix (useAuth.ts)
  - Types: PascalCase (User, LoginRequest)
- **Comments:** Comment cho logic phức tạp
- **Error handling:** try/catch cho tất cả async calls

### Testing:
- Test trên iOS Simulator trước
- Test login → order flow → logout
- Test error cases (wrong password, network error)

### Git Workflow:
- Branch: `feature/mobile-app`
- Commits: Frequent commits với clear messages
- Example: `feat: Add LoginScreen with API integration`

---

## 🆘 Troubleshooting

**Problem:** Metro bundler lỗi "Cannot find module"
**Solution:** `npm install && cd ios && pod install && cd .. && npm start -- --reset-cache`

**Problem:** Axios timeout
**Solution:** Check backend running on http://localhost:3000, tăng timeout trong client.ts

**Problem:** Navigation not working
**Solution:** Check react-native-gesture-handler import in index.js đầu file

---

## 📚 References

- React Navigation: https://reactnavigation.org/docs/getting-started
- React Native Docs: https://reactnative.dev/docs/getting-started
- TypeScript with React Native: https://reactnative.dev/docs/typescript
- Backend API: `/Users/bonnie/.openclaw/workspace-shared/projects/office-lunch-order/ARCHITECTURE.md`

---

## ✅ Done!

Mobile Architecture thiết kế xong! Key deliverables:

1. ✅ **Project structure** đầy đủ
2. ✅ **10 screens** với layout chi tiết
3. ✅ **Navigation flow** (Auth → Main → Admin)
4. ✅ **API integration** strategy (Axios + services)
5. ✅ **State management** (AuthContext + useAuth)
6. ✅ **UI/UX guidelines** (colors, typography, components)
7. ✅ **Dependencies** list
8. ✅ **Setup instructions** step-by-step
9. ✅ **Development workflow** với timeline
10. ✅ **Acceptance criteria** rõ ràng

---

**Next Step:** 
1. Commit & push document này
2. Tag @PmQuick_bot để review
3. Sau khi approve → Giao task chi tiết cho @coder_Quick_bot

**Timeline:** Coder cần 4-6 giờ để code Phase 1 (core features)

🚀 **LET'S BUILD THIS APP!**
