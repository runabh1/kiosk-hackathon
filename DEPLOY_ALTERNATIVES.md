# 🚀 Alternative Free Deployment Options (Railway Trial Expired)

## ⭐ **Option 1: Render (Recommended - Completely Free!)**

### Why Render?
- ✅ **100% FREE** tier available
- ✅ Backend + Database included
- ✅ No credit card required
- ✅ Automatic deploys from GitHub
- ✅ 750 hours/month free (enough for 24/7)
- ✅ PostgreSQL database included

**Total Cost: FREE** ✨

---

## 📋 Render Deployment Steps (15 minutes)

### Part 1: Deploy Backend API (7 min)

#### Step 1: Sign Up for Render
1. Go to **https://render.com**
2. Click **"Get Started for Free"**
3. Sign up with GitHub
4. Authorize Render

---

#### Step 2: Create PostgreSQL Database
1. Click **"New +"** → **"PostgreSQL"**
2. **Name:** `suvidha-db`
3. **Database:** `suvidha`
4. **User:** `suvidha_user`
5. **Region:** Singapore (closest to India)
6. **Plan:** **Free**
7. Click **"Create Database"**
8. Wait for database to be ready (~2 minutes)
9. **Copy the "Internal Database URL"** - you'll need this!

---

#### Step 3: Deploy Backend Service
1. Click **"New +"** → **"Web Service"**
2. Click **"Build and deploy from a Git repository"**
3. Connect your GitHub account if not already
4. Find **"runabh1/kiosk-hackathon"**
5. Click **"Connect"**

**Configure the service:**

```
Name: suvidha-api
Region: Singapore
Branch: main
Root Directory: apps/api
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm start
```

**Instance Type:** Free

---

#### Step 4: Add Environment Variables

In the **Environment** section, add:

```bash
DATABASE_URL
# Paste the Internal Database URL from Step 2

JWT_SECRET
# Value: suvidha-jwt-secret-production-2026-secure-key

JWT_REFRESH_SECRET  
# Value: suvidha-refresh-token-secret-2026-secure

NODE_ENV
# Value: production

PORT
# Value: 10000
# (Render uses port 10000 for free tier)
```

Click **"Create Web Service"**

---

#### Step 5: Run Database Migrations

Once deployed, you need to run migrations:

**Option A: Shell Access (Easier)**
1. Go to your service on Render
2. Click **"Shell"** tab
3. Run:
```bash
cd /opt/render/project/src/packages/database
npx prisma migrate deploy
```

**Option B: Build Command**
Update Build Command to:
```bash
cd packages/database && npx prisma generate && npx prisma migrate deploy && cd ../../apps/api && npm install && npm run build
```

---

#### Step 6: Get Your Backend URL

1. In Render, click on your **suvidha-api** service
2. Find the URL at the top (e.g., `https://suvidha-api.onrender.com`)
3. **Copy this URL** - you'll need it for Vercel!

---

### Part 2: Deploy Frontend on Vercel (5 min)

#### Step 1: Import to Vercel
1. Go to **https://vercel.com**
2. Sign in with GitHub
3. **"Add New..."** → **"Project"**
4. Select **"runabh1/kiosk-hackathon"**
5. Click **"Import"**

---

#### Step 2: Configure Build
```
Framework Preset: Next.js
Root Directory: apps/web
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

---

#### Step 3: Add Environment Variable
```bash
NEXT_PUBLIC_API_URL
# Value: https://suvidha-api.onrender.com
# (Your Render backend URL)
```

Click **"Deploy"**!

---

### Part 3: Enable CORS

1. Go back to **Render**
2. Click your **suvidha-api** service
3. Go to **"Environment"**
4. Add:
```bash
ALLOWED_ORIGINS
# Value: https://your-vercel-app.vercel.app
```
5. Click **"Save Changes"** (will auto-redeploy)

---

## 🎯 Total Deployment Cost

```
Render Backend: FREE ✅
Render PostgreSQL: FREE ✅
Vercel Frontend: FREE ✅

Total: $0.00/month
```

**Limitations:**
- Render free tier sleeps after 15 min inactivity (wakes up automatically)
- Database limited to 1GB storage
- Perfect for hackathons and demos!

---

## ⚡ **Option 2: Supabase + Vercel Serverless (Alternative)**

If Render doesn't work, use this:

### Part 1: Supabase (Database)

1. Go to **https://supabase.com**
2. Sign up with GitHub
3. **"New Project"**
4. Name: `suvidha`
5. Region: Singapore
6. Generate a strong password
7. Click **"Create new project"**
8. Wait for setup (~2 minutes)
9. Go to **Settings** → **Database**
10. Copy the **"Connection string"** (URI format)

---

### Part 2: Vercel (Frontend + Serverless API)

**This requires converting your Express API to Vercel serverless functions.**

1. Create `apps/web/api/` folder
2. Move API routes to serverless functions
3. Deploy to Vercel

**Note:** This is more complex - use Render if possible!

---

## 🔥 **Option 3: Fly.io (Free Tier)**

### Features:
- ✅ Free tier: 3 VMs with 256MB RAM each
- ✅ PostgreSQL included
- ✅ Indian region available
- ✅ Good for production

### Quick Setup:

1. **Install Fly CLI:**
```bash
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

2. **Login:**
```bash
fly auth signup  # or fly auth login
```

3. **Deploy Backend:**
```bash
cd apps/api
fly launch --name suvidha-api
# Follow prompts
```

4. **Add Database:**
```bash
fly postgres create --name suvidha-db
fly postgres attach suvidha-db
```

5. **Deploy:**
```bash
fly deploy
```

---

## 📊 Comparison

| Platform | Backend | Database | Cost | Sleep? | Best For |
|----------|---------|----------|------|--------|----------|
| **Render** | ✅ Free | ✅ Free | $0 | After 15min | **Hackathons** ⭐ |
| **Fly.io** | ✅ Free | ✅ Free | $0 | No | Production |
| **Supabase** | ❌ Need Vercel | ✅ Free | $0 | No | Simple apps |
| **Railway** | ❌ Trial expired | ❌ Trial expired | $5/mo | No | Best UX |

---

## 🎯 My Recommendation

**Use Render!** It's:
- ✅ Easiest to setup
- ✅ Completely free
- ✅ Great for your hackathon
- ✅ No credit card needed
- ✅ Similar to Railway

The sleep after inactivity is not a problem for a demo - it wakes up in ~30 seconds on first request.

---

## 🚀 Quick Start - Render Deploy

**Total time: 15 minutes**

1. **Render.com** → Sign up with GitHub
2. **New PostgreSQL** → Create free database
3. **New Web Service** → Connect GitHub repo
4. **Configure:**
   - Root: `apps/api`
   - Build: `npm install && npm run build`
   - Start: `npm start`
5. **Add env vars** (DATABASE_URL, JWT_SECRET, etc.)
6. **Deploy!**
7. **Vercel.com** → Import project
8. **Configure:**
   - Root: `apps/web`
   - Add: `NEXT_PUBLIC_API_URL`
9. **Deploy!**

**Done! Your app is live!** 🎉

---

## 🐛 Troubleshooting

### Render service won't start?

Check **Logs** tab. Common issues:
- Missing environment variables
- Database not connected
- Port should be 10000 (not 4000)

### Database migration fails?

Use Shell access:
```bash
cd packages/database
npx prisma migrate deploy
```

### Frontend can't connect?

- Check CORS settings in Render
- Verify backend URL in Vercel env vars
- Make sure both use https://

---

**Ready to deploy with Render?** Let me know when you start! 🚀
