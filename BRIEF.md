# 📋 PROJECT BRIEF - Office Lunch Order App

## 🎯 Mục tiêu

Xây dựng app đặt cơm văn phòng cho iOS, cho phép nhân viên:
- Xem menu hàng ngày
- Đặt cơm theo suất
- Xem lịch sử đơn hàng
- Nhận thông báo nhắc nhở

## 👤 User Persona

**Nhân viên văn phòng:**
- Bận rộn, cần đặt cơm nhanh
- Muốn xem menu trước khi đặt
- Cần lịch sử để tracking chi tiêu
- Quên đặt cơm → cần reminder

**Admin/Quản lý:**
- Cập nhật menu hàng ngày
- Xem tổng số suất đã đặt
- Quản lý users

## 📱 Tính năng chi tiết

### Mobile App (React Native iOS)

**1. Authentication**
- Login/Register (Email + Password)
- JWT token storage
- Auto-login

**2. Home Screen**
- Hiển thị menu hôm nay
- Quick order button
- Số suất đã đặt hôm nay

**3. Menu Screen**
- List các món ăn
- Ảnh + mô tả + giá
- Filter theo loại (cơm, phở, bún...)
- Search

**4. Order Screen**
- Chọn món
- Số lượng suất
- Ghi chú (nếu có)
- Xác nhận đặt

**5. History Screen**
- Lịch sử đơn hàng
- Filter theo ngày/tháng
- Tổng chi tiêu
- Chi tiết từng đơn

**6. Profile Screen**
- Thông tin cá nhân
- Settings (notifications, language...)
- Logout

**7. Notifications**
- Nhắc đặt cơm trước 10h
- Thông báo menu mới
- Order confirmation

### Backend API

**Endpoints cần có:**

```
POST   /auth/register          # Đăng ký
POST   /auth/login             # Đăng nhập
GET    /auth/me                # Get user info

GET    /menu                   # Lấy menu (filter by date)
GET    /menu/:id               # Chi tiết món
POST   /menu                   # [Admin] Tạo món mới
PUT    /menu/:id               # [Admin] Cập nhật món
DELETE /menu/:id               # [Admin] Xóa món

GET    /orders                 # Lịch sử đơn hàng
GET    /orders/:id             # Chi tiết đơn
POST   /orders                 # Tạo đơn mới
PUT    /orders/:id             # Cập nhật đơn
DELETE /orders/:id             # Hủy đơn

GET    /users                  # [Admin] List users
GET    /users/:id              # User details
PUT    /users/:id              # Update profile
```

**Database Schema:**

```
Users
- id (PK)
- email (unique)
- password (hashed)
- name
- role (user/admin)
- created_at
- updated_at

Menu
- id (PK)
- name
- description
- price
- image_url
- category (cơm/phở/bún/...)
- available_date
- is_active
- created_at
- updated_at

Orders
- id (PK)
- user_id (FK)
- menu_id (FK)
- quantity
- total_price
- notes
- status (pending/confirmed/cancelled)
- order_date
- created_at
- updated_at
```

## 🛠 Tech Requirements

**Frontend:**
- React Native 0.84 (đã init)
- TypeScript
- React Navigation
- Axios (API calls)
- AsyncStorage (local storage)
- React Native Push Notifications

**Backend:**
- Node.js + Express HOẶC Python + FastAPI (Architect quyết định)
- JWT authentication
- PostgreSQL HOẶC MongoDB (Architect quyết định)
- Docker container
- RESTful API

**DevOps:**
- Docker Compose (local dev)
- CI/CD pipeline
- Environment configs (.env)

## 📊 Milestones & Timeline

**Phase 1: Foundation (Week 1)**
- [ ] Architecture design (Architect)
- [ ] Database schema finalized
- [ ] API contract defined
- [ ] Backend setup + basic auth

**Phase 2: Core Features (Week 2-3)**
- [ ] Menu CRUD APIs
- [ ] Order APIs
- [ ] Mobile screens UI
- [ ] API integration

**Phase 3: Polish (Week 4)**
- [ ] Push notifications
- [ ] Error handling
- [ ] Loading states
- [ ] Testing

**Phase 4: Deployment**
- [ ] Docker deployment
- [ ] Production database
- [ ] App store preparation
- [ ] Documentation

## 🚀 Success Criteria

- [ ] User có thể đăng ký/đăng nhập
- [ ] Xem được menu hôm nay
- [ ] Đặt cơm thành công
- [ ] Xem lịch sử đầy đủ
- [ ] Nhận notifications
- [ ] App không crash
- [ ] Response time < 2s

## 🔗 Resources

**GitHub Repo:** https://github.com/tungadsteam/office-lunch-order  
**Current Structure:**
```
office-lunch-order/
├── OfficeLunchApp/    # React Native (đã init)
├── backend/           # Backend (chờ setup)
└── README.md
```

## 📝 Notes

- UI/UX: Simple, dễ dùng, không cần fancy
- Security: JWT, bcrypt passwords
- Performance: Optimize images, lazy loading
- Scalability: Chuẩn bị cho 100-500 users

---

**Next Step:** @ArchitectEd_bot thiết kế kiến trúc chi tiết, chọn tech stack backend, define API contract rõ ràng.
