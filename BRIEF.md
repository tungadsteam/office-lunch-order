# 📋 PROJECT BRIEF - Lunch Fund Management System

## 🎯 Tổng quan

**Hệ thống quản lý quỹ cơm trưa tập thể** cho văn phòng, bao gồm:
- Quản lý quỹ chung (mỗi người có số dư riêng)
- Đặt cơm hàng ngày
- **Chọn ngẫu nhiên 4 người đi mua** (với thuật toán rotation)
- **Quyết toán tự động**: Chia đều hóa đơn cho tất cả người đặt

---

## 🛠 Tech Stack

- **Mobile:** React Native (iOS)
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Real-time:** WebSocket hoặc Polling (cho danh sách đặt cơm)
- **Notifications:** Push Notifications (APNs)

---

## 👥 Phân quyền User Roles

### 2.1. Admin (Quản trị viên)
- Quản lý danh sách thành viên (thêm/xóa/sửa)
- Theo dõi tổng số dư quỹ của toàn bộ hệ thống
- **Phê duyệt yêu cầu nạp tiền** từ User
- Chỉnh sửa số dư/lịch sử trong trường hợp sai sót
- Xem báo cáo thống kê

### 2.2. User (Người dùng)
- Theo dõi số dư cá nhân, lịch sử nạp/chi
- Thực hiện đặt cơm hàng ngày
- Nhận thông báo khi được chọn đi mua cơm
- Nhập hóa đơn khi trả tiền (nếu là người đi mua)
- Gửi yêu cầu nạp tiền vào quỹ

---

## 📱 Tính năng chi tiết

### 3.1. Quản lý Tài chính & Nạp tiền

**Số dư cá nhân:**
- Hiển thị số tiền hiện có của User
- Cảnh báo khi số dư < 30,000đ (khi nhấn đặt cơm)
- Hiển thị lịch sử giao dịch (nạp tiền, chi tiêu)

**Quy trình nạp tiền (User → Admin xác nhận):**
1. User xem **Số tài khoản Admin** trên App
2. User chuyển khoản ngân hàng
3. User nhấn nút **"Tôi đã nạp tiền"** → Nhập số tiền đã chuyển
4. Admin nhận **Push Notification**: "User X đã nạp Y đồng"
5. Admin kiểm tra ngân hàng → Nhấn **"Xác nhận"** trên App
6. Hệ thống tự động:
   - Cộng tiền vào tài khoản User
   - Ghi lại lịch sử: "Nạp tiền: +500,000đ - Đã xác nhận bởi Admin"

**Database fields:**
```
transactions:
- id
- user_id
- type (deposit/expense)
- amount
- status (pending/approved/rejected)
- note
- admin_id (nếu type=deposit)
- created_at
- approved_at
```

---

### 3.2. Hệ thống Đặt cơm hàng ngày

**Timeline hàng ngày:**
- **8:30 AM - 9:00 AM:** Push notification nhắc đặt cơm
- **11:30 AM:** Chốt sổ tạm thời (để biết số lượng)
- **Sau 11:30 AM:** Vẫn cho phép đặt (cho đến khi người đi mua nhấn "Tổng kết")

**Flow đặt cơm:**
1. User mở App → Màn hình "Đặt cơm hôm nay"
2. Nhấn nút **"Đặt cơm"**
3. Hệ thống check số dư:
   - Nếu < 30,000đ → Hiển thị cảnh báo: "Số dư thấp, vui lòng nạp tiền"
   - Nếu đủ → Thêm vào danh sách
4. Màn hình hiển thị **Real-time**:
   - Danh sách người đã đặt (tên + avatar)
   - Tổng số suất: "15 người đã đặt"

**UI/UX:**
- Danh sách người đặt hiển thị dạng **list hoặc grid**
- Mỗi User chỉ đặt được **1 lần/ngày**
- Nếu đã đặt rồi → Hiển thị nút "Hủy đặt cơm"

---

### 3.3. Thuật toán chọn người đi mua (Buyer Selection)

**Logic phức tạp nhất của hệ thống:**

**Yêu cầu:**
- Tự động chọn **4 người** từ danh sách đã đặt cơm hôm đó
- **Không trùng** với 4 người đã đi hôm trước
- **Ưu tiên** người lâu chưa đi (dựa trên vòng lặp rotation)
- Khi tất cả mọi người đã đi hết 1 lượt → **Reset** danh sách, bắt đầu vòng mới

**Thuật toán đề xuất:**

```
1. Lấy danh sách users đã đặt cơm hôm nay (ví dụ: 15 người)
2. Loại bỏ 4 người đã đi hôm trước
3. Sắp xếp danh sách còn lại theo:
   - last_bought_date ASC (người lâu nhất chưa đi)
   - rotation_index ASC (thứ tự trong vòng rotation)
4. Chọn 4 người đầu tiên
5. Cập nhật:
   - last_bought_date = today
   - rotation_index++
6. Nếu tất cả rotation_index >= total_users:
   - Reset tất cả rotation_index = 0
```

**Database schema:**
```
users:
- id
- name
- last_bought_date (ngày đi mua gần nhất)
- rotation_index (thứ tự trong vòng rotation)
- total_bought_times (tổng số lần đã đi)

daily_orders:
- id
- order_date
- buyer_ids (array: [1,5,8,12]) - 4 người đi mua
- total_participants (15)
- status (selecting_buyers/buying/completed)
- created_at
```

**Màn hình hiển thị:**
- Khu vực riêng: **"Biệt đội đi mua cơm hôm nay"**
- Hiển thị 4 cái tên + avatar
- Icon đặc biệt (ví dụ: 🛒 hoặc 🍱)

---

### 3.4. Quyết toán & Chia hóa đơn (Payment Logic)

**Đây là tính năng QUAN TRỌNG NHẤT - Tự động hóa dòng tiền**

**Flow thanh toán:**

1. **Khi 4 người đi mua xong:**
   - Họ thấy nút **"Tôi trả tiền hôm nay"** trên App
   
2. **Khóa thao tác:**
   - Khi 1 người nhấn nút → 3 người còn lại bị ẩn nút (tránh nhập trùng)
   - Hiển thị: "X đang nhập hóa đơn..."

3. **Người trả tiền nhập liệu:**
   - Màn hình: "Nhập tổng tiền trên hóa đơn"
   - Input: 500,000đ (ví dụ)
   - (Optional) Upload ảnh hóa đơn
   - Nhấn **"Xác nhận thanh toán"**

4. **Xử lý tự động (Backend):**

```javascript
// Giả sử:
const totalBill = 500000; // Tổng hóa đơn
const participants = 15;  // Số người đặt cơm hôm nay
const payerId = 5;        // User ID người trả tiền

// Tính tiền mỗi người
const amountPerPerson = totalBill / participants; // 500000 / 15 = 33,333đ

// Step 1: Cộng tiền cho người trả
await updateUserBalance(payerId, +totalBill); 
// => User 5 được cộng +500,000đ (bù lại tiền mặt họ đã bỏ ra)

// Step 2: Trừ tiền TẤT CẢ người đặt cơm (bao gồm cả người đi mua)
for (const userId of allParticipants) {
  await updateUserBalance(userId, -amountPerPerson);
  // => Mỗi người bị trừ -33,333đ
}

// Step 3: Ghi log
await createTransaction({
  order_id: todayOrderId,
  payer_id: payerId,
  total_bill: totalBill,
  amount_per_person: amountPerPerson,
  participants: allParticipants,
  created_at: now
});
```

**Kết quả cuối cùng:**
- Người trả tiền: +500,000đ - 33,333đ = **+466,667đ** (lãi vì họ bỏ tiền mặt ra)
- 14 người còn lại: mỗi người **-33,333đ**
- Tổng cộng: +500,000 - (15 × 33,333) = 0 ✅ (Balance)

**Lịch sử giao dịch hiển thị:**
```
User 5:
+ Nạp quỹ: +500,000đ (Trả tiền cơm 24/02/2025)
- Chi tiêu: -33,333đ (Cơm 24/02/2025 - 15 người)

User khác:
- Chi tiêu: -33,333đ (Cơm 24/02/2025 - 15 người)
```

---

### 3.5. Thông báo (Push Notifications)

**Các trigger notification:**

| Sự kiện | Người nhận | Nội dung |
|---------|-----------|----------|
| 8:30 AM | Tất cả users | "🍚 Đặt cơm hôm nay chưa?" |
| User nạp tiền | Admin | "💰 X đã nạp Y đồng, vui lòng xác nhận" |
| Admin xác nhận | User đó | "✅ Đã xác nhận nạp tiền +Y đồng" |
| 11:30 AM | 4 người được chọn | "🛒 Bạn được chọn đi mua cơm hôm nay" |
| Người trả tiền xong | 14 người còn lại | "✅ Đã thanh toán 500k - Bạn bị trừ 33k" |
| Số dư < 30k | User đó | "⚠️ Số dư thấp, vui lòng nạp tiền" |

---

## 📊 Database Schema

### Users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'user', -- 'admin' | 'user'
  balance DECIMAL(10, 2) DEFAULT 0,
  last_bought_date DATE,
  rotation_index INT DEFAULT 0,
  total_bought_times INT DEFAULT 0,
  fcm_token VARCHAR(255), -- For push notifications
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Transactions
```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  type VARCHAR(20), -- 'deposit' | 'expense'
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  note TEXT,
  admin_id INT REFERENCES users(id),
  order_id INT REFERENCES daily_orders(id),
  created_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP
);
```

### Daily Orders
```sql
CREATE TABLE daily_orders (
  id SERIAL PRIMARY KEY,
  order_date DATE NOT NULL UNIQUE,
  buyer_ids INT[], -- Array: [1,5,8,12]
  participants_ids INT[], -- Array: [1,2,3,...,15]
  total_bill DECIMAL(10, 2),
  amount_per_person DECIMAL(10, 2),
  payer_id INT REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'ordering', -- 'ordering' | 'buyers_selected' | 'paid' | 'completed'
  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP
);
```

### Order Participants
```sql
CREATE TABLE order_participants (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES daily_orders(id),
  user_id INT REFERENCES users(id),
  is_buyer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔗 API Endpoints

### Authentication
```
POST   /auth/register          # Đăng ký
POST   /auth/login             # Đăng nhập
GET    /auth/me                # Get user info
```

### Users
```
GET    /users                  # [Admin] List all users
GET    /users/:id              # Get user details
PUT    /users/:id/balance      # [Admin] Adjust balance manually
GET    /users/:id/transactions # Get transaction history
```

### Transactions (Nạp tiền)
```
POST   /transactions/deposit   # User request deposit
GET    /transactions/pending   # [Admin] Get pending deposits
PUT    /transactions/:id/approve  # [Admin] Approve deposit
PUT    /transactions/:id/reject   # [Admin] Reject deposit
```

### Daily Orders
```
GET    /orders/today           # Get today's order info
POST   /orders/today/join      # User đặt cơm hôm nay
DELETE /orders/today/leave     # User hủy đặt cơm
POST   /orders/today/select-buyers  # [System] Chọn 4 người đi mua (11:30 AM)
POST   /orders/today/payment   # Người đi mua nhập hóa đơn
GET    /orders/history         # Lịch sử các ngày đã đặt
GET    /orders/:id             # Chi tiết đơn hàng 1 ngày
```

### Admin
```
GET    /admin/stats            # Tổng quan: số dư quỹ, số user, số đơn...
GET    /admin/bank-info        # Lấy STK Admin để hiển thị cho User
PUT    /admin/bank-info        # Update STK
```

---

## 🎨 Mobile Screens

### 1. Auth Screens
- **Login** (Email + Password)
- **Register**

### 2. Home Screen (Dashboard)
- Số dư hiện tại: **150,000đ**
- Nút **"Đặt cơm hôm nay"** (to, nổi bật)
- Thông tin hôm nay:
  - "12 người đã đặt"
  - Danh sách 12 avatar
  - "Biệt đội đi mua: A, B, C, D" (nếu đã chọn)

### 3. Order Today Screen
- Danh sách người đã đặt (real-time)
- Nút "Đặt cơm" / "Hủy đặt cơm"
- Countdown: "Chốt sổ lúc 11:30 AM"

### 4. History Screen
- Lịch sử đơn hàng theo ngày
- Mỗi item: Ngày + Số người + Số tiền đã chi
- Tap vào → Chi tiết đơn

### 5. Transaction History Screen
- Danh sách giao dịch (nạp/chi)
- Filter theo loại, theo tháng
- Tổng chi tiêu trong tháng

### 6. Deposit Screen
- Hiển thị STK Admin
- Nút "Copy STK"
- Nút **"Tôi đã nạp tiền"**
- Input: Số tiền đã chuyển
- Lịch sử nạp tiền (pending/approved)

### 7. Payment Screen (Dành cho 4 người đi mua)
- Chỉ hiện khi user được chọn đi mua
- Nút **"Tôi trả tiền hôm nay"**
- Input: Tổng tiền hóa đơn
- Upload ảnh hóa đơn (optional)

### 8. Profile Screen
- Thông tin cá nhân
- Số dư
- Thống kê: Tổng đã chi, Số lần đi mua
- Logout

### 9. Admin Dashboard (Nếu role = admin)
- Tổng số dư quỹ
- Số user
- Pending deposits (có badge)
- Danh sách users
- Chỉnh sửa số dư

---

## ✅ Success Criteria

**Tính năng:**
- [ ] User đăng ký/đăng nhập thành công
- [ ] User nạp tiền → Admin xác nhận → Cộng tiền tự động
- [ ] User đặt cơm hàng ngày
- [ ] Danh sách đặt cơm hiển thị real-time
- [ ] Hệ thống tự chọn 4 người đi mua (không trùng hôm trước)
- [ ] Người đi mua nhập hóa đơn → Tự động chia bill cho tất cả
- [ ] Push notification hoạt động đúng
- [ ] Lịch sử giao dịch chính xác

**Kỹ thuật:**
- [ ] Backend API RESTful, đầy đủ error handling
- [ ] Database có indexes, foreign keys đúng
- [ ] Mobile app không crash, UX mượt
- [ ] Response time API < 500ms
- [ ] Security: JWT, bcrypt password, SQL injection prevention

**Testing:**
- [ ] Unit tests cho logic chia bill
- [ ] Integration tests cho API
- [ ] Manual test toàn bộ flow

---

## 📝 Notes

**Độ ưu tiên:**
1. **HIGH:** Đặt cơm + Quyết toán tự động
2. **MEDIUM:** Nạp tiền + Chọn người đi mua
3. **LOW:** Thống kê, báo cáo

**Edge cases cần xử lý:**
- Chỉ có 3 người đặt cơm (< 4) → Không chọn người đi mua, admin phải tự lo
- User hủy đặt cơm sau khi đã chọn người đi mua → Cần xử lý lại
- Người được chọn đi mua nhưng không ai nhập hóa đơn → Timeout? Manual admin?
- Số dư âm → Có cho phép không?

**Security considerations:**
- JWT expire time: 7 days (refresh token nếu cần)
- Bcrypt rounds: 10
- SQL injection: Dùng parameterized queries
- XSS: Sanitize inputs

---

**🚀 Next Step:** @ArchitectEd_bot thiết kế chi tiết:
- Database schema optimization (indexes, constraints)
- API contract đầy đủ (request/response examples)
- Kiến trúc backend (folder structure, middleware...)
- Thuật toán chọn 4 người đi mua (code logic cụ thể)
- Docker Compose setup
