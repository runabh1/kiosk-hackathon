# 🚀 SUVIDHA - Quick Deployment Guide

## Part 1: Railway (Backend API + Database) - 10 minutes

### Step 1: Sign Up for Railway

1. Go to **https://railway.app**
2. Click **"Login"** or **"Start a New Project"**
3. Sign in with GitHub
4. Authorize Railway to access your GitHub account

---

### Step 2: Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose **"runabh1/kiosk-hackathon"**
4. Railway will start analyzing your repo

---

### Step 3: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"**
3. Choose **"PostgreSQL"**
4. Railway will provision a database automatically
5. You'll see a new "PostgreSQL" service appear

---

### Step 4: Configure Backend Service

1. Click on the **main service** (your app)
2. Go to **"Settings"** tab
3. Set **Root Directory**: `apps/api`
4. Set **Build Command**: `npm install && npm run build`
5. Set **Start Command**: `npm start`
6. Click **"Save"**

---

### Step 5: Add Environment Variables to Backend

1. In your backend service, go to **"Variables"** tab
2. Click **"+ Add Variable"** for each:

**Add these variables:**

```bash
DATABASE_URL
# Click "Add Reference" → Select "PostgreSQL" → Use "DATABASE_URL"
# Railway auto-fills this!

JWT_SECRET
# Value: suvidha-jwt-secret-key-production-2026-secure

JWT_REFRESH_SECRET
# Value: suvidha-refresh-token-secret-key-production-2026

NODE_ENV
# Value: production

PORT
# Value: 4000
```

3. Click **"Deploy"** after adding variables

---

### Step 6: Run Database Migrations

1. Wait for the backend to deploy (watch the logs)
2. Once deployed, go to your service → **"Settings"**
3. Scroll to **"Custom Start Command"**
4. **Before deploying**, we need to run migrations

**Option A: Using Railway CLI (Recommended)**

Install Railway CLI:
```bash
npm i -g @railway/cli
```

Login and run migrations:
```bash
railway login
railway link
railway run --service=postgresql npx prisma migrate deploy
```

**Option B: Add migration to build**

In **Build Command**, change to:
```bash
cd packages/database && npx prisma generate && npx prisma migrate deploy && cd ../../apps/api && npm install && npm run build
```

---

### Step 7: Get Your Backend URL

1. In Railway, click on your backend service
2. Go to **"Settings"** → **"Networking"**
3. Click **"Generate Domain"**
4. Copy the URL (e.g., `https://your-app-name.up.railway.app`)
5. **Save this URL** - you'll need it for Vercel!

---

## Part 2: Vercel (Frontend) - 5 minutes

### Step 1: Sign Up for Vercel

1. Go to **https://vercel.com**
2. Click **"Sign Up"**
3. Sign in with GitHub
4. Authorize Vercel

---

### Step 2: Import Project

1. Click **"Add New..."** → **"Project"**
2. Find **"runabh1/kiosk-hackathon"** in your repos
3. Click **"Import"**

---

### Step 3: Configure Build Settings

**Framework Preset:** Next.js

**Root Directory:** `apps/web`

**Build Command:** `npm run build`
**Output Directory:** `.next`
**Install Command:** `npm install`

---

### Step 4: Add Environment Variables

Before deploying, click **"Environment Variables"**:

```bash
NEXT_PUBLIC_API_URL
# Value: https://your-railway-app.up.railway.app
# (Use the URL from Railway Step 7)
```

---

### Step 5: Deploy!

1. Click **"Deploy"**
2. Wait for build to complete (2-3 minutes)
3. Vercel will show you a preview URL
4. Click on it to see your live app! 🎉

---

## Part 3: Final Configuration & Testing

### Update CORS on Backend (Important!)

1. Go back to **Railway**
2. Click on your backend service
3. Go to **"Variables"**
4. Add a new variable:

```bash
ALLOWED_ORIGINS
# Value: https://your-vercel-app.vercel.app
# (Use your Vercel URL)
```

5. Redeploy the service

---

### Test Your Deployment

Visit your Vercel URL and test:

1. ✅ **Home page loads**
2. ✅ **Can register new user**
3. ✅ **Can login**
4. ✅ **Dashboard shows up**
5. ✅ **Smart Assistant works**
6. ✅ **Can create grievance**

---

## 🎯 Your Live URLs

After deployment, you'll have:

```
Frontend: https://kiosk-hackathon.vercel.app
Backend:  https://your-app.up.railway.app
Admin:    https://kiosk-hackathon.vercel.app/admin
```

**Share these URLs in your hackathon submission!**

---

## 🐛 Troubleshooting

### Backend won't start?

**Check Railway Logs:**
1. Go to Railway → Your Service → "Deployments"
2. Click on latest deployment
3. Check logs for errors

**Common Fix:** Make sure `DATABASE_URL` is set correctly

---

### Frontend can't connect to backend?

**Check CORS:**
1. Make sure `ALLOWED_ORIGINS` in Railway includes your Vercel URL
2. Make sure `NEXT_PUBLIC_API_URL` in Vercel points to Railway URL
3. Both URLs should use `https://`

---

### Database migration failed?

**Manually run migrations:**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Select your PostgreSQL service
railway run npx prisma migrate deploy
```

---

## 📊 Free Tier Limits

**Vercel:**
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Global CDN

**Railway:**
- ✅ $5 free credits/month
- ✅ ~500 hours execution time
- ✅ Enough for demo/testing
- ⚠️ Will sleep after inactivity

**For production:** Consider upgrading Railway to $5/month

---

## 🎉 Success Checklist

After deployment:

- [ ] Frontend is accessible at Vercel URL
- [ ] Can register a new user
- [ ] Can login successfully
- [ ] Dashboard loads data
- [ ] Smart Assistant button appears
- [ ] Can use Smart Assistant
- [ ] Can create grievances
- [ ] Admin panel accessible
- [ ] All API calls work

---

## 🚀 Optional Enhancements

### Custom Domain (Later)

**Vercel:**
1. Buy domain (e.g., suvidha.in)
2. Add to Vercel project
3. Update DNS records

**Railway:**
1. Use Vercel domain + /api path
2. Or add custom domain in Railway settings

### Enable Production Features

1. Setup email notifications (SendGrid)
2. Add payment gateway (Razorpay)
3. Enable SMS (Twilio)
4. Add monitoring (Sentry)

---

**Ready to deploy! Let's do this! 🚀**

Need help with any step? Just ask!
