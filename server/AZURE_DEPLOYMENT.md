# 🚀 Azure App Service Deployment Guide
**Digital Complaint Box - Backend API**

**Repository:** https://github.com/Jithinnnnnn/complaintbox-backend-.git  
**Status:** ✅ Ready for Azure Deployment

---

## 📋 Quick Deployment Steps

### Step 1: Create Azure App Service

1. Go to [Azure Portal](https://portal.azure.com)
2. Click **Create a resource** → **Web App**
3. Configure:
   - **Name:** `complaintbox-backend` (or your preferred name)
   - **Runtime stack:** Node 20 LTS
   - **Operating System:** Linux
   - **Region:** Choose nearest to your users
   - **Pricing Plan:** B1 or higher

### Step 2: Configure Environment Variables

Go to: **App Service → Configuration → Application Settings**

Add these variables:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/complaint_box
JWT_SECRET=<generate-64-character-secret>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<your-secure-password>
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend-url.com
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Configure MongoDB Atlas

1. Go to MongoDB Atlas → **Network Access**
2. Click **Add IP Address**
3. Add: `0.0.0.0/0` (allows Azure dynamic IPs)
4. Click **Confirm**

### Step 4: Deploy from GitHub

**Option A: Azure Portal (Recommended for first deployment)**

1. Go to: **App Service → Deployment Center**
2. Choose **GitHub** as source
3. Authorize GitHub
4. Select:
   - **Organization:** Jithinnnnnn
   - **Repository:** complaintbox-backend-
   - **Branch:** main
5. Click **Save**

Azure will automatically:
- Pull code from GitHub
- Run `npm install`
- Start server with `npm start`

**Option B: GitHub Actions (Automated)**

1. Download publish profile from Azure Portal
2. Add to GitHub Secrets as `AZURE_PUBLISH_PROFILE`
3. Create `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install
      
      - name: Deploy to Azure
        uses: azure/webapps-deploy@v2
        with:
          app-name: complaintbox-backend
          publish-profile: ${{ secrets.AZURE_PUBLISH_PROFILE }}
```

### Step 5: Configure Health Check

1. Go to: **App Service → Health check**
2. Enable health check
3. Set path: `/health`
4. Save changes

### Step 6: Verify Deployment

**Test Health Endpoint:**
```bash
curl https://complaintbox-backend.azurewebsites.net/health
```

**Expected Response:**
```json
{
  "success": true,
  "status": "ok",
  "database": "connected",
  "uptime": 123.45
}
```

**Test API Endpoint:**
```bash
curl https://complaintbox-backend.azurewebsites.net/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Origin: https://your-frontend.com" \
  -d '{"name":"Test","employeeNumber":"1234567890","password":"test123","department":"IT","workLocation":"Airport"}'
```

---

## 🔍 Monitoring & Logs

### View Live Logs

**Azure Portal:**
- Go to: **App Service → Log stream**
- Look for: "✅ MongoDB connected"
- Look for: "🚀 Server running on port"

**Azure CLI:**
```bash
az webapp log tail --name complaintbox-backend --resource-group your-rg
```

### Common Issues

**Issue:** "Database connection failed"  
**Solution:** Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`

**Issue:** "CORS policy violation"  
**Solution:** Add frontend URL to `ALLOWED_ORIGINS` environment variable

**Issue:** "Health check failing"  
**Solution:** Verify `/health` endpoint returns 200 status code

---

## 📊 Backend Features

✅ **API-only architecture** (no static file serving)  
✅ **Health endpoint** bypasses all middleware  
✅ **CORS** scoped to `/api/*` routes only  
✅ **Rate limiting** (100 req/15min API, 5 req/15min auth)  
✅ **JWT authentication** with bcrypt password hashing  
✅ **MongoDB Atlas** integration  
✅ **Security headers** (Helmet)  
✅ **NoSQL injection** prevention  
✅ **Graceful shutdown** handling  

---

## 🌐 API Endpoints

**Base URL:** `https://complaintbox-backend.azurewebsites.net`

### Public Endpoints
- `GET /health` - Health check (no auth required)

### Authentication
- `POST /api/auth/register` - Employee registration
- `POST /api/auth/login` - Employee login
- `POST /api/auth/admin/login` - Admin login

### Protected Endpoints (JWT Required)
- `GET /api/complaints` - Get all complaints
- `POST /api/complaints` - Submit complaint
- `GET /api/complaints/:id` - Get complaint details

### Admin Endpoints (JWT + Admin Role)
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/pending` - Get pending approvals
- `PATCH /api/admin/users/:id/approval` - Approve/reject user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/complaints` - Get all complaints
- `PATCH /api/admin/complaints/:id/status` - Update status
- `DELETE /api/admin/complaints/:id` - Delete complaint

---

## 🔒 Security Checklist

- [x] Environment variables configured in Azure
- [x] `.env` file NOT committed to Git
- [x] `node_modules` NOT committed to Git
- [x] MongoDB Atlas IP whitelist configured
- [x] Strong JWT secret (64 characters)
- [x] Strong admin password
- [x] CORS restricted to frontend domain
- [x] Rate limiting enabled
- [x] Helmet security headers enabled

---

## 🎯 Next Steps After Deployment

1. **Update Frontend API URL**
   - Change frontend API base URL to: `https://complaintbox-backend.azurewebsites.net`

2. **Update ALLOWED_ORIGINS**
   - Add your frontend production URL to Azure environment variables

3. **Test Complete Flow**
   - Register a test user
   - Login as admin
   - Approve user
   - Login as user
   - Submit complaint
   - Update complaint status

4. **Enable Application Insights** (Optional)
   - Go to: App Service → Application Insights
   - Enable monitoring for performance tracking

---

## 📞 Support

**GitHub Repository:** https://github.com/Jithinnnnnn/complaintbox-backend-  
**Azure App Service:** https://complaintbox-backend.azurewebsites.net

---

**Status:** ✅ DEPLOYMENT READY  
**Last Updated:** 2025-12-23
