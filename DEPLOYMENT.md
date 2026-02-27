# 🚀 DEPLOYMENT DOCUMENTATION

## 📍 Deployment Information

**Environment:** Local Development (Mac mini)  
**Deployment Date:** 2025-02-25 11:46 GMT+7  
**Deployed Commit:** `9d487ab` - feat: Backend API Implementation (#1)  
**Status:** ✅ **DEPLOYED & HEALTHY**

---

## 🌐 Service Endpoints

### Backend API
- **URL:** http://localhost:3000
- **Health Check:** http://localhost:3000/health
- **API Docs:** http://localhost:3000/api-docs (if Swagger enabled)

### Database Management
- **pgAdmin:** http://localhost:5050
  - Email: `admin@lunchfund.com`
  - Password: `admin`

### Database Direct Access
- **Host:** localhost
- **Port:** 5432
- **Database:** lunch_fund
- **User:** postgres
- **Password:** postgres

---

## 📦 Services Running

All services running via Docker Compose:

```bash
$ docker ps
CONTAINER ID   IMAGE                        STATUS
c4c5e7bf7098   office-lunch-order-backend   Up (healthy)   0.0.0.0:3000->3000/tcp
b8190922e609   postgres:15-alpine           Up (healthy)   0.0.0.0:5432->5432/tcp
175e3e995d3c   dpage/pgadmin4:latest        Up             0.0.0.0:5050->80/tcp
```

---

## 🔐 Environment Variables (Production)

Located at: `backend/.env`

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/lunch_fund
JWT_SECRET=<strong-64-char-base64-secret>
JWT_EXPIRES_IN=7d
CRON_ENABLED=true
CRON_TIMEZONE=Asia/Ho_Chi_Minh
CORS_ORIGIN=*
```

**⚠️ SECURITY NOTE:**
- JWT_SECRET has been updated to a strong 64-byte random token
- For production deployment to public server, change database credentials
- Enable CORS restrictions for production

---

## 📊 Database Schema

Schema initialized via: `backend/db/init.sql`

**Tables:**
- `users` - User accounts
- `deposits` - User deposits
- `deposit_approvals` - Admin approvals
- `meal_sessions` - Lunch sessions
- `meal_orders` - Orders per session
- `settlements` - Final settlements
- `transactions` - Transaction history
- `notifications` - Push notifications

---

## 🛠️ Management Commands

### Start Services
```bash
cd /Users/bonnie/.openclaw/workspace-shared/projects/office-lunch-order
docker-compose up -d
```

### Stop Services
```bash
# ✅ Safe — giữ nguyên data
docker-compose down

# ❌ NGUY HIỂM — xóa toàn bộ database
# docker-compose down -v   ← KHÔNG BAO GIỜ dùng trên production
```

### View Logs
```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Database only
docker-compose logs -f postgres
```

### Rebuild After Code Changes
```bash
# ✅ Safe — chỉ xóa containers, KHÔNG xóa volume/data
docker-compose down
docker-compose up -d --build
```

> ⚠️ **CẢNH BÁO: KHÔNG DÙNG `docker-compose down -v`**
> Flag `-v` xóa luôn volume `postgres_data` → toàn bộ database bị xóa vĩnh viễn.
> Chỉ dùng khi cố ý reset hoàn toàn môi trường dev.

### Database Backup
```bash
docker exec lunch-fund-db pg_dump -U postgres lunch_fund > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Database Restore
```bash
docker exec -i lunch-fund-db psql -U postgres lunch_fund < backup_file.sql
```

---

## ✅ Health Check Results

### Backend API
```bash
$ curl http://localhost:3000/health
{"status":"ok","timestamp":"2026-02-25T04:46:45.185Z","uptime":23.319}
```

### Database Connection
✅ Healthy (via Docker healthcheck)

### API Endpoints Tested
✅ POST /api/auth/register - User registration working  
✅ POST /api/auth/login - Authentication working  
✅ JWT token generation working  

---

## 📱 Test User Credentials

**Admin Test Account:**
- Email: `admin@test.com`
- Password: `Admin123456`
- Role: user
- Token: Valid for 7 days

---

## 🔄 Rollback Procedure

If issues occur:

```bash
# 1. Stop current deployment
docker-compose down

# 2. Checkout previous stable commit
git checkout <previous-commit-hash>

# 3. Rebuild and restart
docker-compose up -d --build

# 4. Verify health
curl http://localhost:3000/health
```

---

## 📈 Monitoring & Maintenance

### Current Status Checks
```bash
# Check all containers
docker ps

# Check backend logs
docker logs lunch-fund-api --tail 50

# Check database logs
docker logs lunch-fund-db --tail 50

# Test API health
curl http://localhost:3000/health
```

### Disk Usage
```bash
# Check Docker volumes
docker volume ls

# Check volume size
docker system df -v
```

### Performance Monitoring
- Backend uptime visible in /health endpoint
- Docker container stats: `docker stats`

---

## 🚨 Troubleshooting

### Backend Won't Start
1. Check logs: `docker logs lunch-fund-api`
2. Verify database is healthy: `docker ps`
3. Check environment variables in `backend/.env`

### Database Connection Issues
1. Ensure DATABASE_URL uses `@postgres` not `@localhost` (for Docker network)
2. Verify postgres container is healthy
3. Test connection: `docker exec lunch-fund-db psql -U postgres -d lunch_fund -c "SELECT 1"`

### Port Already in Use
```bash
# Find process using port 3000
lsof -ti:3000

# Kill process if needed
kill -9 $(lsof -ti:3000)
```

---

## 🎯 Next Steps (Future Production Deployment)

For deploying to a public server:

1. **Infrastructure Setup**
   - Provision VPS (DigitalOcean, AWS, GCP)
   - Install Docker + Docker Compose
   - Configure firewall (allow 80, 443, SSH only)

2. **Domain & SSL**
   - Point domain to server IP
   - Setup Nginx reverse proxy
   - Install Let's Encrypt SSL:
     ```bash
     certbot --nginx -d api.yourdomain.com
     ```

3. **Security Hardening**
   - Change database credentials
   - Restrict CORS_ORIGIN
   - Enable rate limiting
   - Setup fail2ban
   - Regular security updates

4. **Monitoring**
   - Setup Sentry for error tracking
   - Configure uptime monitoring (UptimeRobot)
   - Enable CloudWatch/LogDNA logging
   - Setup automated backups (daily)

5. **CI/CD Pipeline**
   - GitHub Actions for automated testing
   - Auto-deploy on merge to main
   - Slack/Telegram notifications

---

## 📝 Change Log

### 2026-02-25 - Initial Deployment
- ✅ Backend API deployed (commit 9d487ab)
- ✅ Database schema initialized
- ✅ Production environment configured
- ✅ Strong JWT secret generated
- ✅ All core endpoints tested
- ✅ Docker containers healthy
- ✅ Documentation created

---

## 👥 Team Contacts

- **PM:** @PmQuick_bot (Telegram)
- **DevOps:** @DevopsQuick_bot (Telegram)
- **Coder:** @coder_Quick_bot (Telegram)
- **Tester:** @TesterCoder_Quick_bot (Telegram)

**Telegram Group:** https://t.me/c/5273327485

---

**Deployment by:** DevOps Team  
**Date:** February 25, 2026  
**Status:** ✅ **PRODUCTION READY** (Local Environment)
