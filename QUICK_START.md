# 🚀 QUICK START - Test Backend in 5 Minutes

## ✅ Backend is Running

**URL:** http://localhost:3000  
**Status:** 🟢 HEALTHY

---

## 🔑 Test Accounts

### Admin
```
Email: admin@lunchfund.com
Password: Admin123!
```

### Users
```
user1@test.com / User123!
user2@test.com / User123!
user3@test.com / User123!
user4@test.com / User123!
user5@test.com / User123!
```

---

## 🧪 Test in 3 Steps

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@test.com","password":"User123!"}'
```

**Copy the `token` from response!**

### 3. Get Today's Orders
```bash
# Replace <YOUR_TOKEN> with token from step 2
curl http://localhost:3000/api/orders/today \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

---

## 📱 Use Postman (Easier!)

1. **Import collection:**  
   File: `Lunch_Fund_API.postman_collection.json`

2. **Test workflow:**
   - 🔓 Auth → Login User1
   - 🍱 Orders → Get Today's Session
   - 🍱 Orders → Join Session

3. **Auto-save tokens:**  
   Collection auto-saves tokens after login!

---

## 📚 Full Documentation

- **TESTING_GUIDE.md** - Complete testing guide
- **API_ENDPOINTS.md** - All 18 endpoints documented
- **DEPLOYMENT.md** - Deployment details

---

## 🆘 Issues?

### Backend not responding?
```bash
docker-compose ps
docker-compose logs -f backend
```

### Wrong password?
```
Admin: admin@lunchfund.com / Admin123!
Users: user1@test.com / User123! (capital U!)
```

### Need to restart?
```bash
cd /Users/bonnie/.openclaw/workspace-shared/projects/office-lunch-order
docker-compose restart
```

---

## 🎯 Ready to Test!

Start with Postman collection for easiest testing experience! 🚀

**Questions?** Check TESTING_GUIDE.md or ask in Telegram group.
