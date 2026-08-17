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

### **Database & External Services**
- **Database**: MongoDB Atlas (via Mongoose)
- **Job Search Provider**: Adzuna API (India Market `in`)
- **AI Engine**: Google Gemini API (Stage 5)
- **Email Service**: Resend API (Stage 7)

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
│       │   └── mongodb.ts    # MongoDB Atlas Mongoose connection
│       ├── middleware/
│       │   ├── authMiddleware.ts       # JWT authentication guard
│       │   ├── dbCheckMiddleware.ts    # Database connection verification
│       │   ├── validationMiddleware.ts # Zod request validation wrapper
│       │   └── error-handler.ts        # Express error handler middleware
│       ├── models/
│       │   └── User.ts       # Mongoose User schema & bcrypt logic
│       ├── services/
│       │   └── adzuna.service.ts # Adzuna REST API service & payload normalizer
│       ├── validators/
│       │   ├── authValidators.ts # Auth validation schemas
│       │   └── jobValidators.ts  # Job search query validation schemas
│       ├── controllers/
│       │   ├── authController.ts # User auth & profile endpoints
│       │   └── jobsController.ts # Adzuna job search & detail endpoints
│       └── routes/
│           ├── health.ts     # Health endpoints (/api/health & /api/health/db)
│           ├── auth.ts       # User authentication routes
│           ├── jobs.ts       # Job search routes (/api/jobs/search & /api/jobs/:id)
│           └── resume.ts     # AI resume analysis placeholder
└── frontend/
    ├── package.json          # React frontend dependencies
    ├── tsconfig.json         # React TypeScript configuration
    ├── vite.config.ts        # Vite configuration & dev API proxy (-> http://localhost:5001)
    ├── tailwind.config.js    # Design system tokens & colors
    ├── postcss.config.js     # PostCSS configuration
    ├── index.html            # Entry HTML with Inter typography & metadata
    └── src/
        ├── main.tsx          # React DOM root mounting
        ├── App.tsx           # Router configuration
        ├── index.css         # Tailwind directives & glassmorphism utilities
        ├── context/
        │   └── AuthContext.tsx # User session & token state context
        ├── services/
        │   └── api.ts        # Axios API client & job search service methods
        ├── components/
        │   ├── ProtectedRoute.tsx # Auth route guard
        │   ├── Navbar.tsx    # Header with navigation & session controls
        │   ├── Footer.tsx    # Footer with architecture tags
        │   └── Layout.tsx    # Responsive page layout wrapper
        └── pages/
            ├── LandingPage.tsx   # Hero section & feature preview
            ├── LoginPage.tsx     # Functional login form
            ├── RegisterPage.tsx  # Functional registration form
            ├── DashboardPage.tsx # Candidate dashboard & profile editor
            ├── JobSearchPage.tsx # Real-time Adzuna job search UI & filters
            └── JobDetailsPage.tsx# Job details & external application redirect
```

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` in the workspace root and/or `backend/`:

```bash
cp .env.example .env
cp .env.example backend/.env
```

| Variable | Required | Description |
|---|---|---|
| `PORT` | Optional | Local Express Server Port (Default: `5001`) |
| `MONGODB_URI` | Required | MongoDB Atlas Connection String (`mongodb+srv://...`) |
| `JWT_SECRET` | Required | Secret key for JWT token signing |
| `ADZUNA_APP_ID` | Required | Adzuna Developer Application ID |
| `ADZUNA_APP_KEY` | Required | Adzuna Developer Application Key |

---

## 📡 Adzuna Job Search API Documentation

### **1. Search Jobs (`GET /api/jobs/search`)**
- **Access**: Public
- **Query Parameters**:
  - `keyword` (string): Search query for job title/skills (e.g. `developer`).
  - `location` (string): City or region (e.g. `delhi`, `bengaluru`).
  - `page` (number): Page number (Default: `1`).
  - `resultsPerPage` (number): Results count (Default: `20`, Max: `50`).
  - `sortBy` (string): `'relevance'`, `'date'`, or `'salary'`.
  - `salaryMin` (number): Minimum annual salary in INR.
  - `fullTime` (`1` / `0`): Filter full-time positions.
  - `permanent` (`1` / `0`): Filter permanent positions.

- **Example Request**:
  ```bash
  curl "http://localhost:5001/api/jobs/search?keyword=software+developer&location=delhi&page=1"
  ```

- **Example Standardized Response**:
  ```json
  {
    "success": true,
    "data": {
      "jobs": [
        {
          "id": "4892019482",
          "title": "Senior Software Engineer",
          "company": {
            "name": "Tech Corp India"
          },
          "location": {
            "displayName": "Delhi, India",
            "area": ["India", "Delhi"]
          },
          "description": "We are seeking an experienced Full Stack Developer proficient in React and Node.js...",
          "salary": {
            "min": 1200000,
            "max": 1800000,
            "isPredicted": false
          },
          "url": "https://www.adzuna.co.in/land/ad/...",
          "created": "2026-08-17T12:00:00Z",
          "contractType": "permanent",
          "contractTime": "full_time",
          "category": "IT Jobs"
        }
      ],
      "pagination": {
        "page": 1,
        "resultsPerPage": 20,
        "total": 450,
        "totalPages": 23
      },
      "country": "India (in)",
      "attribution": "Jobs powered by Adzuna"
    }
  }
  ```

### **2. Get Job Details (`GET /api/jobs/:id`)**
- **Access**: Public
- **Example Request**:
  ```bash
  curl "http://localhost:5001/api/jobs/4892019482"
  ```

---

## 🏷️ Adzuna Required Attribution & Rate Limiting

Per Adzuna's API Terms of Use, all job listing displays include visible attribution:
**"Jobs powered by [Adzuna](https://www.adzuna.com)"**.

**Rate Limiting Notice**:
- Our Express backend proxies requests to Adzuna to keep API keys private.
- Avoid aggressive automated polling. Adzuna rate-limit responses (HTTP 429) are handled gracefully by returning a clean JSON error response to the client.
