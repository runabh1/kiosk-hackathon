# 🚀 SUVIDHA Kiosk - Deployment Guide

## 📋 Application Stack

Your SUVIDHA application consists of:
- **Frontend:** Next.js 14 (React) - `apps/web`
- **Backend API:** Node.js/Express - `apps/api`
- **Database:** PostgreSQL with Prisma ORM
- **Monorepo:** Turborepo with shared packages

---

## 🎯 Recommended Hosting Options

### ⭐ **Option 1: Vercel + Railway (Easiest & Free Tier Available)**

**Best for:** Quick deployment, testing, small-scale production

#### **Frontend (Next.js) → Vercel**
- ✅ **Free tier:** 100GB bandwidth/month
- ✅ **Zero config:** Automatic Next.js optimization
- ✅ **Global CDN:** Fast worldwide
- ✅ **Auto SSL:** HTTPS by default
- ✅ **Preview deployments:** Every git push

**Steps:**
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy from web folder
cd apps/web
vercel

# 3. Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_API_URL=https://your-api-url.railway.app
```

**Cost:** Free for hobby projects, $20/month for Pro

---

#### **Backend API + Database → Railway**
- ✅ **Free tier:** $5 credit/month (enough for testing)
- ✅ **PostgreSQL included:** One-click database
- ✅ **Easy deploy:** From GitHub
- ✅ **Automatic SSL**
- ✅ **Environment variables** built-in

**Steps:**
```bash
# 1. Create Railway account at railway.app
# 2. Click "New Project" → "Deploy from GitHub"
# 3. Select your repository
# 4. Add PostgreSQL service
# 5. Set environment variables:
DATABASE_URL=<from Railway PostgreSQL>
JWT_SECRET=your-super-secret-key-here
PORT=4000
NODE_ENV=production

# 6. Set root directory to "apps/api"
# 7. Build command: npm install && npm run build
# 8. Start command: npm start
```

**Cost:** $5/month for starter plan after free credits

**Total Cost:** **FREE** for testing, **~$25/month** for production

---

### 🏆 **Option 2: AWS (Production-Grade for Government Use)**

**Best for:** Official government deployment, high traffic, compliance

#### **Architecture:**
```
Frontend (Next.js)     → AWS Amplify / Vercel
Backend API            → AWS EC2 / Elastic Beanstalk
Database               → AWS RDS (PostgreSQL)
File Storage           → AWS S3
CDN                    → CloudFront
Load Balancer          → ALB
```

#### **Deployment Steps:**

**1. Database (RDS PostgreSQL)**
```bash
# AWS Console → RDS → Create Database
# - Engine: PostgreSQL 15
# - Template: Free tier (for testing) or Production
# - DB instance: db.t3.micro (free tier eligible)
# - Storage: 20GB SSD
# - Backup: 7 days retention
# - Multi-AZ: YES for production
```

**2. Backend API (EC2 or Elastic Beanstalk)**

**Option A: EC2 (More control)**
```bash
# 1. Launch Ubuntu EC2 instance (t3.small or larger)
# 2. SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# 3. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# 4. Clone your repository
git clone https://github.com/your-repo/suvidha.git
cd suvidha

# 5. Install dependencies and build
npm install
npm run build

# 6. Set environment variables
nano apps/api/.env
# Add: DATABASE_URL, JWT_SECRET, etc.

# 7. Start with PM2
cd apps/api
pm2 start dist/index.js --name suvidha-api
pm2 startup
pm2 save

# 8. Setup Nginx reverse proxy
sudo apt install nginx
sudo nano /etc/nginx/sites-available/suvidha
```

Nginx config:
```nginx
server {
    listen 80;
    server_name api.suvidha.gov.in;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Option B: Elastic Beanstalk (Managed)**
```bash
# 1. Install EB CLI
pip install awsebcli

# 2. Initialize
cd apps/api
eb init -p node.js-20 suvidha-api --region ap-south-1

# 3. Create environment
eb create suvidha-api-prod

# 4. Set environment variables
eb setenv DATABASE_URL="..." JWT_SECRET="..." NODE_ENV=production

# 5. Deploy
eb deploy
```

**3. Frontend (Amplify or Vercel)**

**Option A: AWS Amplify**
```bash
# AWS Console → Amplify → New App → GitHub
# - Select repository
# - Build settings:
{
  "version": 1,
  "applications": [
    {
      "frontend": {
        "phases": {
          "preBuild": {
            "commands": ["cd apps/web", "npm install"]
          },
          "build": {
            "commands": ["npm run build"]
          }
        },
        "artifacts": {
          "baseDirectory": ".next",
          "files": ["**/*"]
        }
      },
      "appRoot": "apps/web"
    }
  ]
}

# Set environment variables:
# NEXT_PUBLIC_API_URL=https://api.suvidha.gov.in
```

**AWS Cost Estimate:**
- EC2 t3.small: ₹1,200/month
- RDS db.t3.micro: ₹1,000/month
- S3 + CloudFront: ₹500/month
- Elastic Load Balancer: ₹1,500/month

**Total:** **₹4,200-6,000/month** (~$50-70/month)

---

### 🇮🇳 **Option 3: Indian Cloud Providers**

**Best for:** Data sovereignty, government compliance, Indian hosting

#### **A. NIC (National Informatics Centre) - MeghRaj Cloud**
- 🇮🇳 **Government cloud platform**
- ✅ **Compliant** with Indian data laws
- ✅ **Secure** and audited
- ✅ **Support** for government projects

**Contact:** https://meity.gov.in/emeghraj

---

#### **B. CloudJiffy (Indian PaaS)**
- 🇮🇳 Based in India
- ✅ **Easy deployment**
- ✅ **Auto-scaling**
- ✅ **PostgreSQL included**

```bash
# 1. Sign up at cloudjiffy.com
# 2. Create New Environment
# 3. Select: Node.js 20 + PostgreSQL 15
# 4. Deploy via Git
# 5. Set environment variables
```

**Cost:** ₹800-2,000/month

---

#### **C. Digital Ocean (Mumbai Datacenter)**
- 🌍 Global with India region
- ✅ **Simple UI**
- ✅ **Good docs**
- ✅ **Managed databases**

**Deployment:**
```bash
# 1. Create Droplet (Mumbai region)
# 2. Create Managed PostgreSQL Database
# 3. Deploy app using Docker or PM2
# 4. Use App Platform for frontend
```

**Cost:** ₹800-3,000/month

---

### 🐳 **Option 4: Docker + Any VPS (Most Flexible)**

**Best for:** Full control, any hosting provider

#### **1. Create Docker Setup**

Create `docker-compose.yml` in root:
```yaml
version: '3.8'

services:
  # Database
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: suvidha
      POSTGRES_USER: suvidha_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  # Backend API
  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://suvidha_user:${DB_PASSWORD}@postgres:5432/suvidha
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
      PORT: 4000
    ports:
      - "4000:4000"
    depends_on:
      - postgres

  # Frontend
  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: https://api.yourdomain.com
    ports:
      - "3000:3000"
    depends_on:
      - api

volumes:
  postgres_data:
```

Create `apps/api/Dockerfile`:
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/database/package*.json ./packages/database/

# Install dependencies
RUN npm install

# Copy source
COPY apps/api ./apps/api
COPY packages/database ./packages/database

# Build
WORKDIR /app/packages/database
RUN npx prisma generate

WORKDIR /app/apps/api
RUN npm run build

# Expose port
EXPOSE 4000

# Start
CMD ["npm", "start"]
```

Create `apps/web/Dockerfile`:
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/web/package*.json ./apps/web/

RUN npm install

COPY apps/web ./apps/web

WORKDIR /app/apps/web
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

**Deploy to any VPS:**
```bash
# 1. Install Docker on VPS
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 2. Clone repository
git clone https://github.com/your-repo/suvidha.git
cd suvidha

# 3. Set environment variables
nano .env
# Add: DB_PASSWORD, JWT_SECRET

# 4. Run database migrations
docker-compose run api npx prisma migrate deploy

# 5. Start all services
docker-compose up -d

# 6. Setup Nginx for reverse proxy
```

---

## 🎯 **My Recommendation for SUVIDHA**

### **For Testing/Development:**
```
Frontend: Vercel (Free)
Backend: Railway (Free tier)
Database: Railway PostgreSQL (Included)

Total Cost: FREE
```

### **For Production (Government Use):**
```
Frontend: Vercel Pro ($20/month) or AWS Amplify
Backend: AWS EC2 (₹1,200/month)
Database: AWS RDS PostgreSQL (₹1,500/month)
Domain: .gov.in domain
SSL: AWS Certificate Manager (Free)

Total Cost: ₹3,000-5,000/month ($35-60/month)
```

### **For Government Compliance:**
```
Everything: NIC MeghRaj Cloud
- Meets government standards
- Data stays in India
- Audit trails
- Support for government entities

Cost: Contact NIC for government pricing
```

---

## 📝 Pre-Deployment Checklist

### **1. Environment Variables**
Create `.env.production`:
```bash
# Frontend (apps/web/.env)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Backend (apps/api/.env)
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-super-secret-key-minimum-32-characters
JWT_REFRESH_SECRET=another-secret-key-for-refresh-tokens
NODE_ENV=production
PORT=4000

# Database (packages/database/.env)
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

### **2. Security**
- [ ] Change all default passwords
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Setup CORS properly
- [ ] Enable rate limiting
- [ ] Setup database backups
- [ ] Enable logging and monitoring

### **3. Database**
```bash
# Run migrations in production
cd packages/database
npx prisma migrate deploy
npx prisma generate
```

### **4. Domain Setup**
```bash
# For .gov.in domain:
# 1. Apply through NIC: https://registry.gov.in
# 2. Point DNS to your hosting:
#    A record: @ → your-server-ip
#    A record: api → your-api-server-ip
#    CNAME: www → your-domain.com
```

---

## 🔒 Production Best Practices

### **1. Database Backups**
```bash
# Automated daily backups
# AWS RDS: Automatic
# Railway: Built-in
# Self-hosted: Setup cron job
0 2 * * * pg_dump -U user dbname > backup-$(date +\%Y\%m\%d).sql
```

### **2. Monitoring**
- Use **PM2** for process monitoring
- Setup **CloudWatch** (AWS) or **Railway Logs**
- Add **Sentry** for error tracking
- Use **UptimeRobot** for uptime monitoring

### **3. SSL Certificate**
```bash
# With Certbot (Let's Encrypt)
sudo certbot --nginx -d suvidha.gov.in -d api.suvidha.gov.in
```

### **4. Scaling**
- Use **PM2 cluster mode** for API
- Enable **Next.js caching**
- Add **Redis** for session storage
- Use **CDN** for static assets

---

## 🚀 Quick Start - Deploy Now!

### **Fastest Path (5 minutes):**

1. **Deploy to Vercel:**
```bash
cd apps/web
npx vercel --prod
```

2. **Deploy to Railway:**
- Go to https://railway.app
- Click "New Project" → "Deploy from GitHub"
- Add PostgreSQL
- Set environment variables
- Done!

3. **Update API URL in Vercel:**
- Vercel Dashboard → Environment Variables
- Add: `NEXT_PUBLIC_API_URL=https://your-railway-url.app`

---

## 📞 Support Resources

- **AWS India Support:** https://aws.amazon.com/contact-us/
- **NIC MeghRaj:** https://meity.gov.in/emeghraj
- **Railway Discord:** https://discord.gg/railway
- **Vercel Support:** https://vercel.com/support

---

## ✅ Next Steps

1. Choose hosting option based on your needs
2. Setup accounts on chosen platforms
3. Configure environment variables
4. Deploy database and run migrations
5. Deploy backend API
6. Deploy frontend
7. Test thoroughly
8. Setup monitoring and backups
9. Go live! 🎉

---

**Need help with deployment?** Let me know which option you choose and I can provide step-by-step guidance!
