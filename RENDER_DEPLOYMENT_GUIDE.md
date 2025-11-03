# 🚀 WorkOrbit Backend - Render Deployment Guide

Complete guide to deploy WorkOrbit backend API to Render.com

---

## 📋 Prerequisites

Before starting, ensure you have:

- [x] GitHub account (to push your code)
- [x] Render account (free tier available at [render.com](https://render.com))
- [x] All required API keys and credentials:
  - OneSignal App ID & API Key
  - Perplexity API Key
  - Email credentials (Gmail/SMTP)
  - AWS S3 credentials (optional, for file uploads)

---

## 🎯 Deployment Options

### Option 1: Automated Deployment (Recommended)

Use the `render.yaml` file for one-click deployment.

### Option 2: Manual Setup via Dashboard

Configure each service manually through Render dashboard.

---

## 📦 Option 1: Automated Deployment with Blueprint

### Step 1: Prepare Your Repository

1. **Push code to GitHub** (if not already):
   ```bash
   cd Workorbit-Flutter-backend/Workorbit-Flutter-backend

   # Initialize git if needed
   git init
   git add .
   git commit -m "Initial commit - WorkOrbit Backend"

   # Add remote and push
   git remote add origin https://github.com/YOUR_USERNAME/workorbit-backend.git
   git branch -M main
   git push -u origin main
   ```

2. **Verify files are committed**:
   - `render.yaml` ✅
   - `package.json` ✅
   - `src/` folder ✅
   - `.gitignore` (should exclude `node_modules`, `.env`)

### Step 2: Connect to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Select the repository: `workorbit-backend`
5. Render will auto-detect `render.yaml`

### Step 3: Configure Environment Variables

Render will prompt you to add secret environment variables:

#### Required Secrets (Add in Render Dashboard):

```env
# OneSignal (Push Notifications)
ONESIGNAL_APP_ID=your_onesignal_app_id
ONESIGNAL_API_KEY=your_onesignal_rest_api_key

# Perplexity AI
PERPLEXITY_API_KEY=your_perplexity_api_key

# Email Service (Gmail example)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# AWS S3 (Optional - for file uploads)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET_NAME=workorbit-uploads
AWS_REGION=us-east-1
```

#### Auto-Generated (by Render):
- `JWT_SECRET` ✅
- `JWT_REFRESH_SECRET` ✅
- `SESSION_SECRET` ✅
- `DATABASE_URL` ✅ (from PostgreSQL database)

### Step 4: Deploy

1. Click **"Apply"** to create services
2. Render will:
   - Create PostgreSQL database
   - Create web service (API)
   - Install dependencies
   - Run migrations
   - Start the server

3. Wait for deployment (usually 5-10 minutes)

### Step 5: Run Database Migrations

After first deployment:

1. Go to your web service in Render Dashboard
2. Click **"Shell"** tab
3. Run migrations:
   ```bash
   npm run db:migrate
   ```

4. Verify migrations succeeded

---

## 🛠️ Option 2: Manual Setup via Dashboard

### Step 1: Create PostgreSQL Database

1. In Render Dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `workorbit-db`
   - **Database**: `workorbit`
   - **User**: `workorbit_user`
   - **Region**: Oregon (or your preferred region)
   - **Plan**: Free (or Starter for production)

3. Click **"Create Database"**
4. Wait for provisioning
5. **Copy the Internal Database URL** (will be used in web service)

### Step 2: Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:

   **Basic Settings**:
   - **Name**: `workorbit-api`
   - **Region**: Oregon (same as database)
   - **Branch**: `main`
   - **Root Directory**: `.` (or specify backend folder if monorepo)
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

   **Advanced Settings**:
   - **Health Check Path**: `/health`
   - **Plan**: Free (or Starter/Standard for production)

### Step 3: Add Environment Variables

In the web service settings, add these environment variables:

```env
# Node Environment
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=[Use Internal Database URL from Step 1]

# JWT Secrets (generate random strings)
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_chars
SESSION_SECRET=your_super_secret_session_key_min_32_chars

# OneSignal
ONESIGNAL_APP_ID=your_onesignal_app_id
ONESIGNAL_API_KEY=your_onesignal_rest_api_key

# Perplexity AI
PERPLEXITY_API_KEY=your_perplexity_api_key

# Email Service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@workorbit.com

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET_NAME=workorbit-uploads
AWS_REGION=us-east-1

# Frontend URL (for CORS)
FRONTEND_URL=https://your-flutter-web-app.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will build and deploy automatically
3. Watch the logs for any errors

### Step 5: Run Migrations

Once deployed:

1. Go to web service → **"Shell"** tab
2. Run:
   ```bash
   npm run db:migrate
   ```

---

## 🔐 Getting API Keys

### OneSignal (Push Notifications)

1. Go to [onesignal.com](https://onesignal.com)
2. Create account / Sign in
3. Create new app: **"WorkOrbit"**
4. Go to **Settings** → **Keys & IDs**
5. Copy:
   - **App ID** → `ONESIGNAL_APP_ID`
   - **REST API Key** → `ONESIGNAL_API_KEY`

### Perplexity AI

1. Go to [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Sign in / Create account
3. Generate API Key
4. Copy → `PERPLEXITY_API_KEY`

### Gmail App Password

1. Enable 2-Step Verification in Google Account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Create app password for "WorkOrbit"
4. Copy 16-character password → `EMAIL_PASSWORD`

### AWS S3 (Optional)

1. Go to [AWS Console](https://console.aws.amazon.com)
2. Create S3 bucket: `workorbit-uploads`
3. Create IAM user with S3 access
4. Generate access keys
5. Copy credentials

---

## ✅ Post-Deployment Checklist

After deployment, verify:

- [ ] **API Health Check**: Visit `https://your-app.onrender.com/health`
  - Should return: `{"status": "OK", "timestamp": "..."}`

- [ ] **Database Connection**: Check logs for database connection success

- [ ] **Migrations Applied**: Run `npm run db:migrate` in Shell

- [ ] **Test API Endpoint**:
  ```bash
  curl https://your-app.onrender.com/api/v1/health
  ```

- [ ] **Test Login**: Use Postman or mobile app to test login

- [ ] **OneSignal Working**: Create expense to test notifications

- [ ] **Environment Variables**: All secrets configured correctly

---

## 🔧 Troubleshooting

### Build Failures

**Error**: `Cannot find module 'xyz'`
- **Fix**: Ensure all dependencies in `package.json`
- Run: `npm install xyz --save`

**Error**: `npm ERR! code ELIFECYCLE`
- **Fix**: Check build logs for specific error
- Verify Node version compatibility

### Database Connection Errors

**Error**: `ECONNREFUSED` or `Connection timeout`
- **Fix**: Use **Internal Database URL**, not External
- Format: `postgresql://user:password@host:port/database`

**Error**: `relation "Users" does not exist`
- **Fix**: Run migrations:
  ```bash
  npm run db:migrate
  ```

### Migration Errors

**Error**: `Migrations are not pending`
- **Fix**: Already applied, safe to ignore

**Error**: `Migration XXX failed`
- **Fix**: Check migration file for SQL errors
- Rollback: `npm run db:migrate:undo`
- Fix migration
- Re-run: `npm run db:migrate`

### Runtime Errors

**Error**: `Port already in use`
- **Fix**: Remove hardcoded port, use `process.env.PORT`
- Render sets `PORT` automatically

**Error**: `JWT secret not found`
- **Fix**: Add `JWT_SECRET` env variable in Render Dashboard

**Error**: `OneSignal API error`
- **Fix**: Verify `ONESIGNAL_APP_ID` and `ONESIGNAL_API_KEY` are correct

---

## 🚀 Update Deployment

### Auto-Deploy on Git Push (Recommended)

1. Make changes locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update: description of changes"
   git push origin main
   ```
3. Render auto-deploys from `main` branch
4. Monitor logs in Render Dashboard

### Manual Deploy

1. Go to Render Dashboard → Your Web Service
2. Click **"Manual Deploy"** → **"Deploy latest commit"**

---

## 📊 Monitoring & Logs

### View Logs

1. Go to Render Dashboard → Your Web Service
2. Click **"Logs"** tab
3. Filter by:
   - All logs
   - Build logs
   - Deploy logs

### Monitor Health

1. Set up health check: `/health` endpoint
2. Render auto-monitors and alerts on failures
3. Configure notifications in Render settings

### Database Management

1. **Connect to database**:
   - Use provided connection string
   - Tools: pgAdmin, DBeaver, psql CLI

2. **Database Backups**:
   - Free plan: No automatic backups
   - Paid plans: Daily automated backups
   - Manual backup: Export via psql

---

## 💰 Pricing

### Free Tier Limitations

**Web Service (Free)**:
- 750 hours/month
- Sleeps after 15 min inactivity
- Cold starts (slow first request after sleep)
- Shared resources

**PostgreSQL (Free)**:
- 90 days free trial
- Then $7/month
- 256MB storage
- 100 concurrent connections

### Production Recommendations

**Web Service**: Starter ($7/month) or higher
- No sleep
- Always available
- Faster performance
- More resources

**PostgreSQL**: Starter ($7/month) or higher
- Daily backups
- 1GB+ storage
- Better performance

---

## 🔗 Important URLs

After deployment, you'll have:

1. **API URL**: `https://workorbit-api.onrender.com`
   - Use this in Flutter app `.env`: `BASE_URL=https://workorbit-api.onrender.com`

2. **Database URL**: Internal URL for backend
   - Format: `postgresql://user:pass@host:5432/db`

3. **Health Check**: `https://workorbit-api.onrender.com/health`

---

## 📱 Update Flutter App

After deployment, update Flutter app configuration:

**File**: `Workorbit-Flutter-anil/.env`

```env
# Update BASE_URL to your Render deployment
BASE_URL=https://workorbit-api.onrender.com
API_VERSION=/api/v1

# Keep other settings
ONESIGNAL_APP_ID=your_app_id
GOOGLE_MAPS_API_KEY=your_maps_key
```

Rebuild Flutter app:
```bash
flutter clean
flutter pub get
flutter run
```

---

## 🎯 Quick Start Commands

```bash
# Clone and setup (if starting fresh)
git clone https://github.com/YOUR_USERNAME/workorbit-backend.git
cd workorbit-backend
npm install

# Test locally before deploying
npm run dev

# Deploy to Render (via Git)
git add .
git commit -m "Deploy to Render"
git push origin main

# SSH into Render (for debugging)
# Go to Dashboard → Shell tab
npm run db:migrate
npm run health
```

---

## ✅ Deployment Complete Checklist

- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] PostgreSQL database created
- [ ] Web service created and deployed
- [ ] All environment variables added
- [ ] Database migrations run successfully
- [ ] Health check endpoint working
- [ ] Test API endpoints (login, register)
- [ ] OneSignal notifications working
- [ ] Flutter app updated with new BASE_URL
- [ ] Mobile app tested with production API

---

## 📞 Support

**Render Documentation**: [docs.render.com](https://docs.render.com)

**Common Issues**:
- Database connection: Check Internal URL
- Build failures: Check dependencies
- Runtime errors: Check environment variables
- Migrations: Run in Shell tab

**Need Help?**
- Check Render status: [status.render.com](https://status.render.com)
- Community: [community.render.com](https://community.render.com)

---

## 🎉 Success!

Your WorkOrbit backend is now deployed and accessible at:
**https://workorbit-api.onrender.com**

Test it:
```bash
curl https://workorbit-api.onrender.com/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-11-03T12:00:00.000Z",
  "uptime": 123.45,
  "database": "connected"
}
```

---

**Version**: 1.0.0
**Last Updated**: November 3, 2025
**Deployment Platform**: Render.com
**Status**: Production Ready ✅
