# 🌐 WEB ARCHITECTURE - Lunch Fund Management System

## 🎯 Overview

**Modern web application** thay thế iOS mobile app với đầy đủ tính năng quản lý quỹ cơm trưa.

**Target Users:**
- Desktop browsers (Chrome, Safari, Firefox)
- Mobile browsers (responsive design)

**Key Features:**
- 🔐 Authentication (JWT)
- 💰 Balance management & deposit requests
- 🍱 Daily lunch ordering
- 📊 Transaction history
- 👥 Admin dashboard
- 📱 Fully responsive (mobile-first design)

---

## 🛠️ Tech Stack

### Frontend Framework: **Next.js 14 (App Router)**

**Rationale:**
- ✅ React-based → Large ecosystem, team familiar
- ✅ App Router → Modern, server components, built-in routing
- ✅ TypeScript → Type safety, better DX
- ✅ API Routes → Can proxy backend if needed
- ✅ SEO-friendly → SSR/SSG support (not critical but nice to have)
- ✅ Fast refresh → Great DX
- ✅ Built-in optimization → Image, fonts, etc.

**Alternatives considered:**
- Vue 3 + Nuxt 3 → Good but team less familiar
- React SPA (Vite + React Router) → Simpler but less features
- **Decision:** Next.js wins for DX + features + future-proof

---

### UI Framework: **TailwindCSS + shadcn/ui**

**Rationale:**
- ✅ TailwindCSS → Utility-first, fast development, small bundle
- ✅ shadcn/ui → Beautiful components, accessible, customizable
- ✅ Radix UI primitives → Headless, accessible
- ✅ No runtime overhead → Pure CSS
- ✅ Dark mode support → Built-in

**Alternatives:**
- Material-UI → Too heavy, opinionated styling
- Ant Design → Enterprise-focused, overkill for this project
- Chakra UI → Good but shadcn/ui more modern
- **Decision:** TailwindCSS + shadcn/ui for speed + quality

---

### State Management: **Zustand**

**Rationale:**
- ✅ Simple API → Easy to learn
- ✅ No boilerplate → Less code than Redux
- ✅ TypeScript support → Excellent
- ✅ Small bundle → ~1KB
- ✅ React 18 compatible → Concurrent features

**Alternatives:**
- Redux Toolkit → Overkill for this app size
- React Context → Works but Zustand cleaner
- Jotai/Recoil → Good but Zustand simpler
- **Decision:** Zustand for simplicity + performance

---

### HTTP Client: **Axios**

**Rationale:**
- ✅ Interceptors → Easy token injection
- ✅ Request/response transformation
- ✅ Timeout handling
- ✅ Cancel tokens
- ✅ Better error handling than fetch

**Alternatives:**
- Native fetch → No interceptors, more verbose
- TanStack Query (React Query) → Great but adds complexity
- **Decision:** Axios for now, can add React Query later

---

### Form Handling: **React Hook Form + Zod**

**Rationale:**
- ✅ React Hook Form → Performance, minimal re-renders
- ✅ Zod → TypeScript schema validation
- ✅ Works well together
- ✅ Small bundle size

---

### Additional Libraries

| Library | Purpose | Version |
|---------|---------|---------|
| `date-fns` | Date formatting | ^3.0.0 |
| `clsx` | Conditional classes | ^2.0.0 |
| `lucide-react` | Icons | ^0.300.0 |
| `sonner` | Toast notifications | ^1.3.0 |
| `@tanstack/react-table` | Data tables (admin) | ^8.11.0 |
| `socket.io-client` | Real-time (optional Phase 2) | ^4.6.0 |

---

## 📂 Project Structure

```
office-lunch-order/
├── web/
│   ├── app/                        # Next.js 14 App Router
│   │   ├── (auth)/                 # Auth routes group
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (dashboard)/            # Protected routes group
│   │   │   ├── layout.tsx          # Sidebar layout
│   │   │   ├── page.tsx            # Dashboard home
│   │   │   ├── order/
│   │   │   │   └── page.tsx        # Daily order page
│   │   │   ├── history/
│   │   │   │   └── page.tsx        # Order history
│   │   │   ├── balance/
│   │   │   │   └── page.tsx        # Balance & deposit
│   │   │   ├── profile/
│   │   │   │   └── page.tsx        # User profile
│   │   │   └── admin/              # Admin routes
│   │   │       ├── page.tsx        # Admin dashboard
│   │   │       ├── deposits/
│   │   │       │   └── page.tsx    # Approve deposits
│   │   │       └── users/
│   │   │           └── page.tsx    # User management
│   │   │
│   │   ├── api/                    # API routes (optional proxy)
│   │   │   └── [...proxy]/
│   │   │       └── route.ts
│   │   │
│   │   ├── layout.tsx              # Root layout
│   │   ├── globals.css             # Global styles
│   │   └── providers.tsx           # Context providers
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── BalanceCard.tsx
│   │   │   ├── OrderSummaryCard.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   └── QuickActions.tsx
│   │   │
│   │   ├── order/
│   │   │   ├── OrderForm.tsx
│   │   │   ├── ParticipantsList.tsx
│   │   │   ├── BuyersBadge.tsx
│   │   │   └── PaymentModal.tsx
│   │   │
│   │   ├── balance/
│   │   │   ├── DepositForm.tsx
│   │   │   ├── BankInfoCard.tsx
│   │   │   └── TransactionList.tsx
│   │   │
│   │   └── admin/
│   │       ├── PendingDepositsTable.tsx
│   │       ├── UsersTable.tsx
│   │       ├── StatsOverview.tsx
│   │       └── SelectBuyersButton.tsx
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts           # Axios instance
│   │   │   ├── endpoints.ts        # API endpoints
│   │   │   └── services/
│   │   │       ├── auth.ts
│   │   │       ├── orders.ts
│   │   │       ├── transactions.ts
│   │   │       ├── users.ts
│   │   │       └── admin.ts
│   │   │
│   │   ├── store/                  # Zustand stores
│   │   │   ├── authStore.ts
│   │   │   ├── orderStore.ts
│   │   │   └── uiStore.ts
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useOrder.ts
│   │   │   ├── useBalance.ts
│   │   │   └── useMediaQuery.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── formatters.ts       # Currency, date
│   │   │   ├── validators.ts       # Input validation
│   │   │   ├── constants.ts
│   │   │   └── cn.ts               # clsx helper
│   │   │
│   │   └── types/
│   │       ├── user.ts
│   │       ├── order.ts
│   │       ├── transaction.ts
│   │       └── api.ts
│   │
│   ├── public/
│   │   ├── logo.svg
│   │   └── ...
│   │
│   ├── .env.local
│   ├── .env.example
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── README.md
│
└── (backend, mobile...)
```

---

## 🎨 Design System

### Color Palette

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',  // Main blue
          600: '#2563eb',
          700: '#1d4ed8',
        },
        success: '#10b981',   // Green
        warning: '#f59e0b',   // Orange
        danger: '#ef4444',    // Red
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          500: '#6b7280',
          700: '#374151',
          900: '#111827',
        },
      },
    },
  },
};
```

### Typography

```css
/* globals.css */
@layer base {
  h1 { @apply text-4xl font-bold tracking-tight; }
  h2 { @apply text-3xl font-semibold; }
  h3 { @apply text-2xl font-semibold; }
  h4 { @apply text-xl font-medium; }
  p { @apply text-base leading-7; }
  small { @apply text-sm text-gray-600; }
}
```

### Spacing

Follow Tailwind defaults: 4px base unit (1 = 0.25rem)

---

## 📱 Pages & Layouts

### 1. Auth Pages (Public)

#### Login Page (`/login`)

**Layout:**
```
┌──────────────────────────────────┐
│                                  │
│        [Logo]                    │
│                                  │
│    Lunch Fund Manager            │
│                                  │
│   ┌────────────────────────┐    │
│   │ Email                  │    │
│   └────────────────────────┘    │
│                                  │
│   ┌────────────────────────┐    │
│   │ Password               │    │
│   └────────────────────────┘    │
│                                  │
│   [ Đăng nhập ]                  │
│                                  │
│   Chưa có tài khoản? Đăng ký     │
│                                  │
└──────────────────────────────────┘
```

**Features:**
- Email + password inputs
- Form validation (Zod schema)
- Loading state
- Error messages
- Link to Register
- Remember me (optional)

**API:**
```typescript
POST /api/auth/login
Body: { email, password }
Response: { success, data: { user, token } }
```

---

#### Register Page (`/register`)

**Similar layout to Login**

**Fields:**
- Name, Email, Phone, Password

**API:**
```typescript
POST /api/auth/register
Body: { name, email, phone, password }
Response: { success, data: { user, token } }
```

---

### 2. Dashboard Layout (Protected)

**Responsive Layout:**
- Desktop: Sidebar (fixed left) + Main content
- Mobile: Bottom nav bar + Hamburger menu

**Sidebar Items:**
- 🏠 Dashboard
- 🍱 Đặt cơm hôm nay
- 📜 Lịch sử
- 💰 Số dư / Nạp tiền
- 👤 Tài khoản
- 🔧 Admin (if role === 'admin')

---

#### Dashboard Home (`/`)

**Layout:**
```
┌─────────────────────────────────────┐
│ ☰  Dashboard              👤 User   │
├─────────────────────────────────────┤
│                                     │
│  Xin chào, Nguyen Van A             │
│                                     │
│  ┌────────────────┐ ┌────────────┐ │
│  │ 💰 Số dư       │ │ 🍱 Hôm nay │ │
│  │ 150,000đ       │ │ 12 người   │ │
│  │ [Nạp tiền]     │ │ [Chi tiết] │ │
│  └────────────────┘ └────────────┘ │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ 📊 Thống kê tháng này        │  │
│  │ Tổng chi: 450,000đ           │  │
│  │ Đi mua: 3 lần                │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ 🕒 Hoạt động gần đây         │  │
│  │ • 24/02 - Cơm: -33,333đ      │  │
│  │ • 23/02 - Cơm: -35,000đ      │  │
│  │ • 20/02 - Nạp: +500,000đ     │  │
│  └──────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

**Components:**
- BalanceCard: Balance + deposit button
- OrderSummaryCard: Today's order count + link
- StatsCard: Monthly stats
- RecentActivity: Last 5 transactions

**APIs:**
```typescript
GET /api/auth/me → User info
GET /api/orders/today → Today's order
GET /api/transactions/history?limit=5 → Recent
```

---

#### Daily Order Page (`/order`)

**Layout:**
```
┌─────────────────────────────────────┐
│ ←  Đặt cơm hôm nay                  │
├─────────────────────────────────────┤
│  Thứ 6, 24/02/2025                  │
│  15 người đã đặt                    │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ 🛒 Biệt đội đi mua           │  │
│  │ • Nguyen Van A               │  │
│  │ • Tran Thi B                 │  │
│  │ • Le Van C                   │  │
│  │ • Pham Thi D                 │  │
│  └──────────────────────────────┘  │
│                                     │
│  Danh sách người đặt:               │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ [🅰] Nguyen Van A            │  │
│  │ [🅱] Tran Thi B              │  │
│  │ [🅲] Le Van C   🛒           │  │
│  │ ...                          │  │
│  └──────────────────────────────┘  │
│                                     │
│  [ Đặt cơm ] / [ Hủy đặt ]          │
│                                     │
│  ⚠️ Nếu bạn là buyer:               │
│  [ Nhập hóa đơn ]                   │
│                                     │
└─────────────────────────────────────┘
```

**Features:**
- Display session status
- List participants (real-time update với polling)
- Highlight 4 buyers
- Button "Đặt cơm" / "Hủy đặt"
- PaymentModal (if user is buyer)

**APIs:**
```typescript
GET /api/orders/today → Session + participants
POST /api/orders/today/join → Join order
DELETE /api/orders/today/leave → Cancel order
POST /api/orders/today/payment → Submit payment (buyers only)
```

**Real-time:**
- Poll GET /api/orders/today every 5 seconds (Phase 1)
- WebSocket (Phase 2 optional)

---

#### Order History Page (`/history`)

**Layout:**
```
┌─────────────────────────────────────┐
│ ←  Lịch sử đặt cơm                  │
├─────────────────────────────────────┤
│  Tháng 2/2025                       │
│  Tổng chi: 450,000đ                 │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ 24/02 - Thứ 6               │  │
│  │ 15 người • 33,333đ          │  │
│  │ Trạng thái: ✅ Đã thanh toán │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ 23/02 - Thứ 5               │  │
│  │ 12 người • 35,000đ          │  │
│  │ Trạng thái: ✅               │  │
│  └──────────────────────────────┘  │
│                                     │
│  [ Load more... ]                   │
│                                     │
└─────────────────────────────────────┘
```

**Features:**
- List past orders
- Pagination (load more)
- Filter by month
- Click to view detail (optional)

**API:**
```typescript
GET /api/orders/history?limit=30&offset=0
```

---

#### Balance & Deposit Page (`/balance`)

**Layout:**
```
┌─────────────────────────────────────┐
│ ←  Số dư & Nạp tiền                 │
├─────────────────────────────────────┤
│  💰 Số dư hiện tại: 150,000đ        │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ 🏦 Thông tin chuyển khoản    │  │
│  │                              │  │
│  │ Ngân hàng: Vietcombank       │  │
│  │ STK: 1234567890 [ Copy ]     │  │
│  │ Chủ TK: NGUYEN VAN A         │  │
│  └──────────────────────────────┘  │
│                                     │
│  Số tiền đã chuyển:                 │
│  ┌────────────────────────────┐    │
│  │ 500000                     │    │
│  └────────────────────────────┘    │
│                                     │
│  Ghi chú (optional):                │
│  ┌────────────────────────────┐    │
│  │ Nạp tiền tháng 2           │    │
│  └────────────────────────────┘    │
│                                     │
│  [ Tôi đã nạp tiền ]                │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ 📜 Lịch sử nạp tiền          │  │
│  │ • 500k - Đang chờ ⏳          │  │
│  │ • 200k - Đã duyệt ✅          │  │
│  └──────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

**Features:**
- Display current balance
- Bank info (GET /api/admin/bank-info)
- Copy button for account number
- Deposit form
- Pending deposits list

**APIs:**
```typescript
GET /api/admin/bank-info → Bank account
POST /api/transactions/deposit → Submit deposit
GET /api/transactions/history?type=deposit
```

---

### 3. Admin Pages (Protected, role='admin')

#### Admin Dashboard (`/admin`)

**Layout:**
```
┌─────────────────────────────────────┐
│ 🔧 Admin Dashboard                  │
├─────────────────────────────────────┤
│  ┌────────┐ ┌────────┐ ┌────────┐  │
│  │ Users  │ │ Tổng $ │ │ Pending│  │
│  │   25   │ │  3.5M  │ │   3    │  │
│  └────────┘ └────────┘ └────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ [ Duyệt nạp tiền ] Badge: 3  │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ [ Chọn người đi mua ]         │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ [ Quản lý người dùng ]        │  │
│  └──────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

**Features:**
- Stats overview
- Quick action buttons
- Link to sub-pages

**API:**
```typescript
GET /api/admin/stats
```

---

#### Pending Deposits (`/admin/deposits`)

**Layout:**
```
┌─────────────────────────────────────┐
│ ←  Duyệt nạp tiền                   │
├─────────────────────────────────────┤
│  ┌──────────────────────────────┐  │
│  │ Nguyen Van A                 │  │
│  │ 500,000đ                     │  │
│  │ "Nạp tiền tháng 2"           │  │
│  │ 24/02 10:30                  │  │
│  │ [ Duyệt ] [ Từ chối ]        │  │
│  └──────────────────────────────┘  │
│                                     │
│  (More items...)                    │
│                                     │
└─────────────────────────────────────┘
```

**Features:**
- Table/list of pending deposits
- Approve/Reject buttons
- Confirmation dialog

**APIs:**
```typescript
GET /api/transactions/pending
PUT /api/transactions/:id/approve
```

---

#### Users Management (`/admin/users`)

**Table with:**
- Name, Email, Balance, Role, Status
- Actions: Edit balance, Deactivate

**API:**
```typescript
GET /api/users
PUT /api/users/:id/balance
```

---

## 🔌 API Integration

### Axios Client

```typescript
// lib/api/client.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const client = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Inject token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle errors
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired → Redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    
    const message = error.response?.data?.message || 'Network error';
    return Promise.reject(new Error(message));
  }
);

export default client;
```

### API Services

```typescript
// lib/api/services/auth.ts
import client from '../client';

export const authService = {
  login: async (email: string, password: string) => {
    return client.post('/auth/login', { email, password });
  },
  
  register: async (data: { name: string; email: string; password: string; phone?: string }) => {
    return client.post('/auth/register', data);
  },
  
  getMe: async () => {
    return client.get('/auth/me');
  },
};
```

```typescript
// lib/api/services/orders.ts
import client from '../client';

export const ordersService = {
  getToday: async () => {
    return client.get('/orders/today');
  },
  
  join: async () => {
    return client.post('/orders/today/join');
  },
  
  leave: async () => {
    return client.delete('/orders/today/leave');
  },
  
  submitPayment: async (data: { total_bill: number; note?: string }) => {
    return client.post('/orders/today/payment', data);
  },
  
  getHistory: async (limit = 30, offset = 0) => {
    return client.get(`/orders/history?limit=${limit}&offset=${offset}`);
  },
};
```

Similar for `transactions.ts`, `users.ts`, `admin.ts`

---

## 🧠 State Management (Zustand)

### Auth Store

```typescript
// lib/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../api/services/auth';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  balance: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await authService.login(email, password);
          const { token, user } = response.data;
          
          localStorage.setItem('auth_token', token);
          set({ user, token, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await authService.register(data);
          const { token, user } = response.data;
          
          localStorage.setItem('auth_token', token);
          set({ user, token, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      logout: () => {
        localStorage.removeItem('auth_token');
        set({ user: null, token: null });
      },
      
      fetchUser: async () => {
        try {
          const response = await authService.getMe();
          set({ user: response.data });
        } catch (error) {
          console.error('Fetch user error:', error);
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }), // Only persist token
    }
  )
);
```

### Order Store (Optional)

```typescript
// lib/store/orderStore.ts
import { create } from 'zustand';
import { ordersService } from '../api/services/orders';

interface OrderState {
  todaySession: any | null;
  participants: any[];
  fetchToday: () => Promise<void>;
  joinOrder: () => Promise<void>;
  leaveOrder: () => Promise<void>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  todaySession: null,
  participants: [],
  
  fetchToday: async () => {
    try {
      const response = await ordersService.getToday();
      set({
        todaySession: response.data.session,
        participants: response.data.participants,
      });
    } catch (error) {
      console.error('Fetch today error:', error);
    }
  },
  
  joinOrder: async () => {
    await ordersService.join();
    await get().fetchToday(); // Refresh
  },
  
  leaveOrder: async () => {
    await ordersService.leave();
    await get().fetchToday(); // Refresh
  },
}));
```

---

## 🎣 Custom Hooks

### useAuth Hook

```typescript
// lib/hooks/useAuth.ts
import { useAuthStore } from '../store/authStore';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const { user, token, isLoading, login, register, logout, fetchUser } = useAuthStore();
  const router = useRouter();
  
  const handleLogin = async (email: string, password: string) => {
    await login(email, password);
    router.push('/');
  };
  
  const handleLogout = () => {
    logout();
    router.push('/login');
  };
  
  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
    login: handleLogin,
    register,
    logout: handleLogout,
    fetchUser,
  };
};
```

### useOrder Hook

```typescript
// lib/hooks/useOrder.ts
import { useOrderStore } from '../store/orderStore';
import { useEffect } from 'react';

export const useOrder = () => {
  const { todaySession, participants, fetchToday, joinOrder, leaveOrder } = useOrderStore();
  
  useEffect(() => {
    fetchToday();
    
    // Poll every 5 seconds (Phase 1)
    const interval = setInterval(fetchToday, 5000);
    return () => clearInterval(interval);
  }, []);
  
  return {
    session: todaySession,
    participants,
    refresh: fetchToday,
    join: joinOrder,
    leave: leaveOrder,
  };
};
```

---

## 🔐 Authentication Flow

### Protected Routes

```typescript
// components/layout/ProtectedRoute.tsx
'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return null;
  }
  
  return <>{children}</>;
}
```

### Dashboard Layout

```typescript
// app/(dashboard)/layout.tsx
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
```

---

## 🎨 Key Components

### BalanceCard

```typescript
// components/dashboard/BalanceCard.tsx
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatCurrency } from '@/lib/utils/formatters';
import Link from 'next/link';

export function BalanceCard() {
  const { user } = useAuth();
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Số dư hiện tại</p>
          <p className="text-3xl font-bold">{formatCurrency(user?.balance || 0)}</p>
        </div>
        <div>
          <Link href="/balance">
            <Button>Nạp tiền</Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
```

### OrderSummaryCard

```typescript
// components/dashboard/OrderSummaryCard.tsx
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useOrder } from '@/lib/hooks/useOrder';
import Link from 'next/link';

export function OrderSummaryCard() {
  const { session, participants } = useOrder();
  
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-2">🍱 Cơm hôm nay</h3>
      <p className="text-2xl font-bold">{participants.length} người đã đặt</p>
      <Link href="/order">
        <Button variant="outline" className="mt-4">Xem chi tiết</Button>
      </Link>
    </Card>
  );
}
```

### ParticipantsList

```typescript
// components/order/ParticipantsList.tsx
import { Avatar } from '@/components/ui/avatar';

interface Participant {
  id: number;
  name: string;
  is_buyer: boolean;
}

export function ParticipantsList({ participants }: { participants: Participant[] }) {
  return (
    <div className="space-y-2">
      {participants.map((p) => (
        <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
          <Avatar name={p.name} />
          <span className="flex-1">{p.name}</span>
          {p.is_buyer && <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">🛒 Buyer</span>}
        </div>
      ))}
    </div>
  );
}
```

---

## 📦 Setup Instructions

### 1. Initialize Next.js Project

```bash
cd office-lunch-order
npx create-next-app@latest web --typescript --tailwind --app --src-dir --import-alias "@/*"
cd web
```

### 2. Install Dependencies

```bash
npm install zustand axios clsx tailwind-merge date-fns
npm install lucide-react sonner
npm install @tanstack/react-table
npm install react-hook-form zod @hookform/resolvers

# shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input dialog table badge avatar
```

### 3. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 4. Configure tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6',
          foreground: '#ffffff',
        },
        // ... (rest from shadcn)
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

### 5. Project Structure

```bash
mkdir -p lib/{api/services,store,hooks,utils,types}
mkdir -p components/{ui,layout,dashboard,order,balance,admin}
mkdir -p app/{(auth)/{login,register},(dashboard)/{order,history,balance,profile,admin}}
```

### 6. Start Development

```bash
npm run dev
```

Open http://localhost:3001 (assuming backend is on :3000)

---

## 🚀 Development Workflow

### Phase 1: Foundation (2-3 hours)

**Step 1: Setup (30 mins)**
- ✅ Create Next.js project
- ✅ Install dependencies
- ✅ Setup folder structure
- ✅ Configure Tailwind + shadcn/ui

**Step 2: API Layer (1 hour)**
- ✅ Axios client with interceptors
- ✅ API services (auth, orders, transactions)
- ✅ TypeScript types

**Step 3: State Management (30 mins)**
- ✅ Auth store (Zustand)
- ✅ Order store
- ✅ Custom hooks

**Step 4: Auth Pages (1 hour)**
- ✅ Login page
- ✅ Register page
- ✅ Protected route wrapper

---

### Phase 2: Main Features (3-4 hours)

**Step 5: Dashboard Layout (1 hour)**
- ✅ Sidebar component
- ✅ Header component
- ✅ Mobile responsive nav
- ✅ Layout wrapper

**Step 6: Dashboard Home (1 hour)**
- ✅ BalanceCard
- ✅ OrderSummaryCard
- ✅ StatsCard
- ✅ RecentActivity

**Step 7: Order Page (1.5 hours)**
- ✅ Fetch & display today's session
- ✅ Participants list
- ✅ Join/Leave buttons
- ✅ PaymentModal (for buyers)
- ✅ Polling for real-time updates

**Step 8: Balance & History (30 mins)**
- ✅ Balance page with deposit form
- ✅ History page with pagination

---

### Phase 3: Admin (2-3 hours)

**Step 9: Admin Dashboard (1 hour)**
- ✅ Stats overview
- ✅ Quick actions

**Step 10: Admin Pages (2 hours)**
- ✅ Pending deposits table with approve
- ✅ Users management table

---

### Phase 4: Polish (1-2 hours)

**Step 11: UI/UX Polish**
- ✅ Loading states
- ✅ Error handling
- ✅ Toast notifications
- ✅ Responsive design check

**Step 12: Testing**
- ✅ Test all flows
- ✅ Fix bugs

---

## ✅ Acceptance Criteria

**Must Have (Phase 1-2):**
- [ ] Login/Register with backend API
- [ ] Dashboard displays balance + today's order
- [ ] Order page: view participants, join/leave
- [ ] Balance page: view balance, request deposit
- [ ] History page: view past orders
- [ ] Profile page: view info, logout
- [ ] Responsive design (desktop + mobile)

**Must Have (Phase 3):**
- [ ] Admin dashboard
- [ ] Approve pending deposits
- [ ] User management (view, edit balance)

**Nice to Have:**
- [ ] WebSocket real-time updates
- [ ] Dark mode
- [ ] Advanced filters & search

---

## 🎯 Performance Optimization

### Client-side

1. **Code Splitting:**
   - Next.js automatic code splitting
   - Dynamic imports for admin pages

2. **Image Optimization:**
   - Use Next.js `<Image />` component
   - WebP format

3. **Caching:**
   - Cache API responses (optional: React Query)
   - LocalStorage for token

### Server-side (Next.js)

1. **SSR vs CSR:**
   - Auth pages: CSR only
   - Dashboard: CSR with client components
   - (SSR not critical for this app)

2. **API Routes:**
   - Can proxy backend API if needed (CORS, security)
   - Optional: Add caching layer

---

## 🔒 Security Considerations

1. **XSS Prevention:**
   - React escapes by default
   - Avoid dangerouslySetInnerHTML

2. **CSRF Protection:**
   - JWT in Authorization header (not cookies)
   - No CSRF concern

3. **Input Validation:**
   - Zod schemas on frontend
   - Backend validates anyway

4. **Token Storage:**
   - LocalStorage (trade-off: simplicity vs httpOnly cookies)
   - Clear on logout

5. **HTTPS:**
   - Production must use HTTPS
   - Development: localhost HTTP ok

---

## 📝 Deployment Strategy

### Development

```bash
npm run dev
# http://localhost:3001
```

### Production Build

```bash
npm run build
npm start
# Or deploy to Vercel (recommended)
```

### Vercel Deployment (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variable
vercel env add NEXT_PUBLIC_API_URL production
```

**Advantages:**
- ✅ Zero config
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Serverless functions
- ✅ Preview deployments

### Docker (Alternative)

```dockerfile
# web/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml (add to existing)
services:
  # ... (postgres, backend)
  
  web:
    build: ./web
    ports:
      - "3001:3001"
    environment:
      NEXT_PUBLIC_API_URL: http://backend:3000
    depends_on:
      - backend
```

---

## 📚 References

- **Next.js Docs:** https://nextjs.org/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com
- **Zustand:** https://docs.pmnd.rs/zustand
- **React Hook Form:** https://react-hook-form.com
- **Backend API:** `ARCHITECTURE.md` in repo

---

## 🆘 Troubleshooting

**Problem:** CORS error when calling backend
**Solution:** 
- Backend add CORS middleware: `app.use(cors({ origin: 'http://localhost:3001' }))`
- Or proxy via Next.js API routes

**Problem:** Token not persisting
**Solution:** Check Zustand persist middleware, verify localStorage

**Problem:** Real-time not updating
**Solution:** Check polling interval, verify API response

---

## ✅ Done!

Web Architecture thiết kế xong! Key deliverables:

1. ✅ **Tech Stack:** Next.js 14 + TypeScript + TailwindCSS + Zustand
2. ✅ **Project Structure:** Clear folder layout
3. ✅ **Pages Design:** 10+ pages với layout chi tiết
4. ✅ **API Integration:** Axios + services pattern
5. ✅ **State Management:** Zustand stores + hooks
6. ✅ **Authentication:** JWT flow + protected routes
7. ✅ **UI Components:** shadcn/ui based
8. ✅ **Responsive:** Desktop + mobile browser
9. ✅ **Development Plan:** Step-by-step with timeline (6-10 hours)
10. ✅ **Deployment:** Vercel recommended

---

**Timeline Estimate:**
- Phase 1 (Foundation): 2-3 hours
- Phase 2 (Main Features): 3-4 hours
- Phase 3 (Admin): 2-3 hours
- Phase 4 (Polish): 1-2 hours
- **Total: 8-12 hours**

**Next Steps:**
1. Commit & push this document
2. Tag @PmQuick_bot để review
3. Giao task chi tiết cho @coder_Quick_bot
4. Coder bắt đầu implement

🚀 **LET'S BUILD THE WEB APP!**
