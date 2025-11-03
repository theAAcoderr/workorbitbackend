# 🚀 Render Deployment - Quick Checklist

## Pre-Deployment

- [ ] All code committed to Git
- [ ] `.env` file NOT committed (check `.gitignore`)
- [ ] All API keys and credentials ready:
  - [ ] OneSignal App ID & API Key
  - [ ] Perplexity API Key
  - [ ] Email credentials
  - [ ] AWS S3 credentials (optional)
- [ ] `render.yaml` configured
- [ ] Test locally: `npm run dev`

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### 2. Create Render Services

#### Option A: Blueprint (Automated)
- [ ] Go to [Render Dashboard](https://dashboard.render.com)
- [ ] Click "New +" → "Blueprint"
- [ ] Connect GitHub repository
- [ ] Add environment variables
- [ ] Click "Apply"

#### Option B: Manual Setup
- [ ] Create PostgreSQL database
- [ ] Create web service
- [ ] Configure environment variables
- [ ] Deploy

### 3. Configure Environment Variables

Add these in Render Dashboard (Secrets):

```
ONESIGNAL_APP_ID=____________
ONESIGNAL_API_KEY=____________
PERPLEXITY_API_KEY=____________
EMAIL_USER=____________
EMAIL_PASSWORD=____________
```

### 4. Run Migrations
- [ ] Go to Web Service → Shell
- [ ] Run: `npm run db:migrate`
- [ ] Verify migrations succeeded

### 5. Test Deployment
- [ ] Visit: `https://your-app.onrender.com/health`
- [ ] Test login endpoint
- [ ] Test notification system
- [ ] Check logs for errors

## Post-Deployment

### Update Flutter App
- [ ] Update `.env` file:
  ```env
  BASE_URL=https://your-app.onrender.com
  ```
- [ ] Run: `flutter clean && flutter pub get`
- [ ] Test mobile app with production API

### Monitoring
- [ ] Set up health monitoring
- [ ] Configure alerts
- [ ] Monitor logs for errors

## Troubleshooting

If deployment fails:

1. **Check Logs**: Render Dashboard → Logs tab
2. **Verify Env Variables**: All required vars added?
3. **Database Connection**: Using Internal DB URL?
4. **Migrations**: Run in Shell tab
5. **Port**: Remove hardcoded port, use `process.env.PORT`

## Quick Commands

```bash
# Local testing
npm run dev

# Database migrations
npm run db:migrate

# Health check
curl https://your-app.onrender.com/health

# View logs (in Render Shell)
tail -f /var/log/render.log
```

## Success Criteria

✅ Health endpoint returns 200 OK
✅ Database connected successfully
✅ Migrations applied
✅ Login/Register working
✅ Notifications sending
✅ Flutter app connects to production API

---

**Deployment Time**: ~15-20 minutes
**Platform**: Render.com
**Cost**: Free tier available
