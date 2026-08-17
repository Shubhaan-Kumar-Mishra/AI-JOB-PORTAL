# AI Job Portal

A production-quality full-stack AI-powered job application platform built for local development and testing. Users can build profiles, upload resumes, search real job opportunities powered by the Adzuna API, receive Google Gemini AI compatibility scores and skill gap analyses, track applications, and receive email notifications.

---

## 🚀 Tech Stack

### **Frontend**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom glassmorphism design system
- **Routing**: React Router v6
- **HTTP Client**: Axios

### **Backend**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Dev Runner**: `tsx` (TypeScript Execution Engine)

### **Database & Services**
- **Database**: MongoDB Atlas (via Mongoose)
- **Job Search API**: Adzuna API
- **AI Engine**: Google Gemini API
- **Email Service**: Resend API

---

## 📁 Repository Structure

```
ai-job-portal/
├── .env.example              # Centralized environment variable template
├── .gitignore                # Workspace git ignore configuration
├── package.json              # Monorepo root script runner & workspace definitions
├── README.md                 # Technical documentation & setup guide
├── backend/
│   ├── .env.example          # Backend environment variables
│   ├── package.json          # Node.js + Express dependencies
│   ├── tsconfig.json         # Backend TypeScript configuration
│   └── src/
│       ├── index.ts          # Main Express server entry point
│       ├── config/
│       │   └── env.ts        # Environment variable loader (dotenv)
│       ├── db/
│       │   └── mongodb.ts    # MongoDB Atlas Mongoose connection & health check service
│       ├── middleware/
│       │   └── error-handler.ts # Express error handler middleware
│       └── routes/
│           ├── health.ts     # Health endpoints (/api/health and /api/health/db)
│           ├── auth.ts       # Auth route placeholder
│           ├── jobs.ts       # Job search route placeholder
│           └── resume.ts     # AI resume analysis placeholder
└── frontend/
    ├── package.json          # React frontend dependencies
    ├── tsconfig.json         # React TypeScript configuration
    ├── vite.config.ts        # Vite configuration & dev API proxy (-> http://localhost:5000)
    ├── tailwind.config.js    # Design system tokens & colors
    ├── postcss.config.js     # PostCSS configuration
    ├── index.html            # Entry HTML with Inter typography & metadata
    └── src/
        ├── main.tsx          # React DOM root mounting
        ├── App.tsx           # Router configuration
        ├── index.css         # Tailwind directives & glassmorphism utilities
        ├── services/
        │   └── api.ts        # Axios API client & health check service
        ├── components/
        │   ├── Navbar.tsx    # Header with API status indicator
        │   ├── Footer.tsx    # Footer with architecture tags
        │   └── Layout.tsx    # Responsive page layout wrapper
        └── pages/
            ├── LandingPage.tsx   # Hero section & feature preview
            ├── LoginPage.tsx     # Modern login interface placeholder
            ├── RegisterPage.tsx  # User registration placeholder
            └── DashboardPage.tsx # Candidate dashboard & tracking tabs
```

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` in the workspace root and/or `backend/`:

```bash
cp .env.example .env
cp .env.example backend/.env
```

| Variable | Description |
|---|---|
| `PORT` | Local Express Server Port (Default: `5000`) |
| `MONGODB_URI` | MongoDB Atlas Connection String (`mongodb+srv://...`) |
| `JWT_SECRET` | Secret key for JWT token signing |
| `ADZUNA_APP_ID` | Adzuna Jobs API Application ID |
| `ADZUNA_APP_KEY` | Adzuna Jobs API Application Key |
| `GEMINI_API_KEY` | Google Gemini AI API Key |
| `RESEND_API_KEY` | Resend Email API Key |

---

## 🛠️ Local Setup & Quick Start

### **1. Install Dependencies**
```bash
npm install
```

### **2. Start Development Servers**
Run both Frontend (Vite) and Backend (Express) concurrently:
```bash
npm run dev
```

Or start individual services independently:
- **Frontend only** (`http://localhost:5173`):
  ```bash
  npm run dev:frontend
  ```
- **Backend only** (`http://localhost:5000`):
  ```bash
  npm run dev:backend
  ```

---

## 📡 Health Endpoints

- **API Health**: `GET http://localhost:5000/api/health`
  ```json
  {
    "success": true,
    "message": "AI Job Portal API is running",
    "timestamp": "2026-08-17T21:48:00.000Z",
    "version": "1.0.0"
  }
  ```

- **MongoDB Atlas Connection Health**: `GET http://localhost:5000/api/health/db`
  ```json
  {
    "success": true,
    "message": "MongoDB Atlas is connected and healthy",
    "database": {
      "host": "cluster0.xxx.mongodb.net",
      "dbName": "ai_job_portal",
      "readyState": 1
    }
  }
  ```
