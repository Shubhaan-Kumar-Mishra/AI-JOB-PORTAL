# AI Job Portal

A production-quality full-stack AI-powered job application platform. Users can build profiles, upload resumes, search real job opportunities powered by the Adzuna API, receive Google Gemini AI compatibility scores and skill gap analyses, track applications, and receive email notifications.

---

## 🚀 Tech Stack

### **Frontend**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom glassmorphism design system
- **Routing**: React Router v6
- **HTTP Client**: Axios

### **Backend**
- **Runtime**: Cloudflare Workers (Edge V8 Isolates)
- **Framework**: Hono
- **Language**: TypeScript
- **Deployment**: Wrangler CLI

### **Database & Services (Integrated in future stages)**
- **Database**: MongoDB Atlas (Node Client / Fetch architecture)
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
├── README.md                 # Complete documentation & setup guide
├── backend/
│   ├── .env.example          # Backend environment variables
│   ├── package.json          # Cloudflare Worker dependencies
│   ├── tsconfig.json         # Worker TypeScript configuration
│   ├── wrangler.jsonc        # Cloudflare Workers deployment config
│   └── src/
│       ├── index.ts          # Main worker entry point with CORS & routes
│       ├── config/
│       │   └── env.ts        # Environment variable bindings & type safety
│       ├── db/
│       │   └── mongodb.ts    # MongoDB Atlas connection & client service
│       ├── middleware/
│       │   └── error-handler.ts # Centralized error middleware
│       └── routes/
│           ├── health.ts     # Health check endpoint (/api/health)
│           ├── auth.ts       # Auth route placeholder
│           ├── jobs.ts       # Job search route placeholder
│           └── resume.ts     # AI resume analysis placeholder
└── frontend/
    ├── package.json          # React frontend dependencies
    ├── tsconfig.json         # React TypeScript configuration
    ├── vite.config.ts        # Vite configuration & dev API proxy
    ├── tailwind.config.js    # Design system tokens & colors
    ├── postcss.config.js     # PostCSS configuration
    ├── index.html            # Entry HTML with Inter typography & metadata
    └── src/
        ├── main.tsx          # React DOM root mounting
        ├── App.tsx           # Router configuration
        ├── index.css         # Tailwind directives & glassmorphism utilities
        ├── services/
        │   └── api.ts        # Axios API client & health check method
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

Copy `.env.example` to `.env` in both the workspace root and `backend/` directory:

```bash
cp .env.example .env
cp .env.example backend/.env
```

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas Connection String (`mongodb+srv://...`) |
| `JWT_SECRET` | Secret key for JWT token signing |
| `ADZUNA_APP_ID` | Adzuna Jobs API Application ID |
| `ADZUNA_APP_KEY` | Adzuna Jobs API Application Key |
| `GEMINI_API_KEY` | Google Gemini AI API Key |
| `RESEND_API_KEY` | Resend Email API Key |

*Note: Secrets must be supplied via environment variables; never hardcode credentials.*

---

## 🛠️ Local Setup & Quick Start

### **1. Install Dependencies**
Install packages for the entire monorepo from the root directory:
```bash
npm install
```

### **2. Start Development Servers**
Run both Frontend (Vite) and Backend (Cloudflare Workers via Wrangler) concurrently:
```bash
npm run dev
```

Or start individual services independently:
- **Frontend only** (`http://localhost:5173`):
  ```bash
  npm run dev:frontend
  ```
- **Backend only** (`http://localhost:8787`):
  ```bash
  npm run dev:backend
  ```

---

## 📡 Health Check Endpoint

Once the backend is running, verify API status at `http://localhost:8787/api/health` or `http://localhost:5173/api/health` (via Vite proxy):

```json
{
  "success": true,
  "message": "AI Job Portal API is running",
  "timestamp": "2026-08-17T21:24:00.000Z",
  "version": "1.0.0"
}
```

---

## 📌 Current Implementation Status (Stage 1: Foundation)

- [x] Monorepo workspace configuration with npm workspaces
- [x] Cloudflare Workers + Hono backend setup with Wrangler config
- [x] Centralized error handling and CORS middleware
- [x] Working `/api/health` health check endpoint
- [x] Environment variable binding abstractions (`backend/src/config/env.ts`)
- [x] Modular MongoDB Atlas connection service layer (`backend/src/db/mongodb.ts`)
- [x] React + Vite + TypeScript + Tailwind CSS frontend application setup
- [x] React Router setup with Landing, Login, Register, and Dashboard routes
- [x] Axios API integration layer
- [x] Git repository initialization
