# 🏛️ SUVIDHA - Smart City Utility Kiosk Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

> **SUVIDHA** (सुविधा) - A next-generation citizen service delivery platform for Smart Cities, enabling unified utility bill payments, grievance management, and service requests through self-service kiosks.

## 📋 Overview

SUVIDHA is a comprehensive digital platform designed for Indian Smart Cities to provide citizens with seamless access to utility services including:

- ⚡ **Electricity** bill payments and services (APDCL, BSES, etc.)
- 🔥 **Gas** connection and billing management
- 💧 **Water** supply services
- 🏛️ **Municipal** services and certificates

### 🌟 Key Features

#### 🎯 Smart Assistant Mode
- **Natural Language Processing** - Local NLP without external APIs
- **Intent Recognition** - Understands citizen requests in English & Hindi
- **Skip Menu Navigation** - Direct routing to desired services
- **Multilingual** - Full support for English and Hindi

#### 💳 Unified Bill Payments
- Multiple utility services in one platform
- UPI, Card, Net Banking, Wallet support
- Digital receipts & SMS notifications
- Payment history and tracking

#### 📝 Grievance Management
- Quick complaint registration
- Real-time status tracking
- Priority-based escalation
- Timeline tracking with photos

#### 👥 Citizen Dashboard
- View all service connections
- Pending bills overview
- Complaint history
- Document management

#### 🔧 Admin Panel
- Real-time analytics dashboard
- Grievance management system
- Payment tracking
- Kiosk monitoring
- **Intent Analytics** - Smart Assistant usage metrics
New Service Modules:
 Added documentation for Miscellaneous Service Requests (Name Change, Load Enhancement, Meter Testing, etc.).
Document Center:
 Featured the new Official Document Printing capabilities, including Sanction Letters and Approval Certificates with QR verification.
Setup Clarity:
 Updated the installation guide to explicitly include the npx prisma generate steps, ensuring a smooth developer experience.
AI Assistant Insights: 
Expanded the "Usage" section with real-world English/Hindi examples of how the Smart Assistant routes citizens.
Admin Power: 
Documented the new administrative workflows for managing service requests and tracking kiosk health.

## 🏗️ Architecture

```
SUVIDHA/
├── apps/
│   ├── web/              # Next.js 14 Frontend
│   │   ├── src/
│   │   │   ├── app/      # App router pages
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   │   ├── intent-parser.ts  # Smart Assistant NLP
│   │   │   │   └── store/
│   │   │   └── styles/
│   │   └── package.json
│   │
│   └── api/              # Node.js/Express Backend
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── billing/
│       │   │   ├── grievance/
│       │   │   └── admin/
│       │   ├── middleware/
│       │   └── index.ts
│       └── package.json
│
├── packages/
│   └── database/         # Prisma ORM
│       ├── prisma/
│       │   └── schema.prisma
│       └── package.json
│
├── .gitignore
├── turbo.json           # Turborepo config
└── package.json         # Root package
```

## 🚀 Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Icons:** Lucide React
- **State Management:** Zustand
- **i18n:** react-i18next

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Language:** TypeScript
- **Authentication:** JWT
- **Validation:** Zod
- **API Documentation:** OpenAPI/Swagger

### Database
- **Database:** PostgreSQL 15
- **ORM:** Prisma
- **Migrations:** Prisma Migrate

### DevOps
- **Monorepo:** Turborepo
- **Package Manager:** npm
- **Build Tool:** TypeScript Compiler
- **Linting:** ESLint
- **Formatting:** Prettier (recommended)

## 📦 Installation

### Prerequisites
- Node.js 20.x or higher
- PostgreSQL 15.x
- npm 10.x or higher

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/runabh1/kiosk-hackathon.git
cd kiosk-hackathon
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup Database**
```bash
# Create PostgreSQL database
createdb suvidha

# Configure database URLs
cp packages/database/.env.example packages/database/.env
cp apps/api/.env.example apps/api/.env

# Edit .env files with your database credentials
# DATABASE_URL="postgresql://user:password@localhost:5432/suvidha"
```

4. **Run Database Migrations**
```bash
cd packages/database
npx prisma migrate dev
npx prisma generate
```

5. **Start Development Servers**
```bash
# From root directory
npm run dev

# This starts:
# - Frontend at http://localhost:3000
# - Backend API at http://localhost:4000
```

## 🔧 Configuration

### Environment Variables

#### Frontend (`apps/web/.env`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

#### Backend (`apps/api/.env`)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/suvidha
JWT_SECRET=your-super-secret-key-minimum-32-characters
JWT_REFRESH_SECRET=another-secret-for-refresh-tokens
NODE_ENV=development
PORT=4000
```

#### Database (`packages/database/.env`)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/suvidha
```

## 📖 Usage

### Default Users

**Admin Account:**
```
Phone: 9876543210
Password: admin123
```

**Citizen Account:**
```
Phone: 9876543211
Password: user123
```

### Smart Assistant

The Smart Assistant feature allows citizens to describe their needs in natural language:

**Examples:**
- "Pay my electricity bill"
- "बिजली का बिल भरना है" (Pay electricity bill in Hindi)
- "File water complaint"
- "Check my grievance status"

The system automatically:
1. Detects service type (Electricity/Gas/Water/Municipal)
2. Identifies action (Pay Bill/File Complaint/Check Status)
3. Routes directly to the correct page
4. Saves 2-3 navigation steps

## 🛠️ Development

### Available Scripts

```bash
# Install all dependencies
npm install

# Start all services in development
npm run dev

# Build all packages
npm run build

# Run type checking
npm run type-check

# Clean build artifacts
npm run clean

# Database migrations
cd packages/database
npx prisma migrate dev    # Create new migration
npx prisma migrate deploy # Apply migrations
npx prisma studio        # Open Prisma Studio
```

### Project Structure

- **Monorepo:** Uses Turborepo for efficient builds
- **Shared Packages:** Database schema shared across apps
- **Type Safety:** Full TypeScript coverage
- **Code Organization:** Feature-based module structure

## 🚀 Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

### Quick Deploy Options

**Recommended for testing:**
- Frontend: Vercel (Free)
- Backend: Railway (Free tier)
- Database: Railway PostgreSQL

**Recommended for production:**
- Frontend: Vercel Pro / AWS Amplify
- Backend: AWS EC2 / Elastic Beanstalk
- Database: AWS RDS PostgreSQL

**For government deployment:**
- NIC MeghRaj Cloud (Government approved)

## 📊 Features Roadmap

### ✅ Completed
- [x] Multi-service bill payments
- [x] Grievance management system
- [x] Smart Assistant with local NLP
- [x] Multilingual support (English/Hindi)
- [x] Admin analytics dashboard
- [x] Intent analytics
- [x] Kiosk-optimized UI

### 🚧 In Progress
- [ ] SMS notifications
- [ ] Advanced reporting

### ✅ Recently Added
- [x] Payment gateway integration (Razorpay)
- [x] Document upload and management (Grievance attachments)

### 📋 Planned
- [ ] Voice input for Smart Assistant
- [ ] Mobile app (React Native)
- [ ] Offline mode support
- [ ] Biometric authentication
- [ ] WhatsApp integration
- [ ] Regional language support (Assamese, Bengali)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for Smart City initiatives in India
- Inspired by citizen-first service delivery
- Supports Digital India mission

## 📞 Support

For questions or support:
- Create an issue in the GitHub repository
- Contact: support@suvidha.gov.in (example)

## 🏆 Hackathon Details

**Kiosk Hackathon Submission**
- **Repository:** https://github.com/runabh1/kiosk-hackathon
- **Innovation:** Smart Assistant Mode with local NLP
- **Target Users:** Indian Smart Cities & Citizens

---

**Made with ❤️ for Digital India 🇮🇳**
