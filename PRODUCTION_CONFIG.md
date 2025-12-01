# 🔧 Production Configuration Quick Reference

## Domain: biserica-vertical.ro

### Backend .env
```bash
PORT=3000
NODE_ENV=production
DB_PATH=./database.db
JWT_SECRET=<generează-cu-crypto-randomBytes>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://biserica-vertical.ro,https://www.biserica-vertical.ro
FRONTEND_URL=https://biserica-vertical.ro
EMAIL_SERVICE=gmail
EMAIL_USER=blueprintstudioworks@gmail.com
EMAIL_PASSWORD=syue jmqe kuqn qmwb
```

### Frontend .env.production
```bash
VITE_API_BASE_URL=https://biserica-vertical.ro
```

### URLs
- Site: https://biserica-vertical.ro
- API: https://biserica-vertical.ro/api
- Login: https://biserica-vertical.ro/planner/login

---

See PRODUCTION_DEPLOYMENT.md for full deployment guide.

