# AI Job Portal

A production-quality full-stack AI-powered job application platform built for local development and testing. Users can build profiles, upload resumes, search real job opportunities powered by the Adzuna API, save job positions, track job applications across workflow stages, receive Google Gemini AI compatibility scores, and manage their career pipeline.

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
- **Database ORM**: Mongoose
- **Dev Runner**: `tsx` (TypeScript Execution Engine)

### **Database & External Services**
- **Database**: MongoDB Atlas (via Mongoose)
- **Authentication**: JWT & bcryptjs password hashing
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
│   ├── .env.example          # Backend environment variables template
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
│       │   ├── User.ts         # User schema & bcrypt logic
│       │   ├── SavedJob.ts     # Saved jobs schema with compound unique index
│       │   └── Application.ts  # Application tracking schema & status enum
│       ├── services/
│       │   └── adzuna.service.ts # Adzuna REST API service & payload normalizer
│       ├── validators/
│       │   ├── authValidators.ts       # Auth validation schemas
│       │   ├── jobValidators.ts        # Job search query validation schemas
│       │   ├── savedJobValidators.ts   # Saved job payload schemas
│       │   └── applicationValidators.ts# Application tracking validation schemas
│       ├── controllers/
│       │   ├── authController.ts       # User auth & profile endpoints
│       │   ├── jobsController.ts       # Adzuna job search & detail endpoints
│       │   ├── savedJobsController.ts  # Saved jobs CRUD handlers
│       │   └── applicationsController.ts# Application tracking & dashboard stats
│       └── routes/
│           ├── health.ts       # Health endpoints (/api/health & /api/health/db)
│           ├── auth.ts         # User authentication routes
│           ├── jobs.ts         # Job search routes (/api/jobs/search & /api/jobs/:id)
│           ├── savedJobs.ts    # Saved job endpoints (/api/jobs/:id/save & /api/users/saved-jobs)
│           ├── applications.ts # Application endpoints (/api/applications & /api/users/dashboard-stats)
│           └── resume.ts       # AI resume analysis placeholder
└── frontend/
    ├── package.json          # React frontend dependencies
    ├── tsconfig.json         # React TypeScript configuration
    ├── vite.config.ts        # Vite configuration & dev API proxy (-> http://localhost:5001)
    ├── tailwind.config.js    # Design system tokens & colors
    ├── postcss.config.js     # PostCSS configuration
    ├── index.html            # Entry HTML with Inter typography & metadata
    └── src/
        ├── main.tsx          # React DOM root mounting
        ├── App.tsx           # Router configuration with protected routes
        ├── index.css         # Tailwind directives & glassmorphism utilities
        ├── context/
        │   └── AuthContext.tsx # User session & token state context
        ├── services/
        │   └── api.ts        # Axios API client for Auth, Jobs, Saved Jobs, Applications & Stats
        ├── components/
        │   ├── ProtectedRoute.tsx # Auth route guard
        │   ├── Navbar.tsx    # Header with navigation & session controls
        │   ├── Footer.tsx    # Footer with architecture tags
        │   └── Layout.tsx    # Responsive page layout wrapper
        └── pages/
            ├── LandingPage.tsx       # Hero section & feature preview
            ├── LoginPage.tsx         # Functional login form
            ├── RegisterPage.tsx      # Functional registration form
            ├── DashboardPage.tsx     # Candidate dashboard & real-time DB counts
            ├── JobSearchPage.tsx     # Real-time Adzuna job search UI & interactive Save Job toggle
            ├── JobDetailsPage.tsx    # Job details, Save Job toggle & Track Application CTA
            ├── SavedJobsPage.tsx     # Candidate saved jobs collection (/saved-jobs)
            ├── ApplicationsPage.tsx  # Pipeline application tracker (/applications)
            └── ApplicationDetailsPage.tsx # Detailed application manager (/applications/:id)
```

---

## 🗄️ Database Schemas

### **1. SavedJob Schema**
- `userId`: `ObjectId` (Ref: `User`, Required)
- `jobId`: `String` (Required)
- `title`: `String` (Required)
- `companyName`: `String` (Required)
- `location`: `String` (Required)
- `jobUrl`: `String` (Required)
- `salary`: `{ min: Number, max: Number, isPredicted: Boolean }`
- `savedAt`: `Date` (Default: `Date.now`)
- **Index**: Compound unique index `{ userId: 1, jobId: 1 }` (prevents duplicate saves per user).

### **2. Application Schema**
- `userId`: `ObjectId` (Ref: `User`, Required)
- `jobId`: `String` (Required)
- `jobTitle`: `String` (Required)
- `companyName`: `String` (Required)
- `location`: `String` (Required)
- `jobUrl`: `String` (Required)
- `status`: `Enum` (`'applied'`, `'under_review'`, `'interview'`, `'offer'`, `'rejected'`), Default: `'applied'`
- `notes`: `String` (Max length: 2000)
- `appliedAt`: `Date` (Default: `Date.now`)
- **Index**: Compound unique index `{ userId: 1, jobId: 1 }` (prevents duplicate applications per user).

---

## 📡 Stage 4 API Endpoints

### **Saved Jobs Endpoints**

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/jobs/:id/save` | Protected | Saves a job position to authenticated user's collection. |
| `DELETE` | `/api/jobs/:id/save` | Protected | Removes saved job position from authenticated user's collection. |
| `GET` | `/api/users/saved-jobs` | Protected | Lists candidate's saved jobs with pagination support. |
| `GET` | `/api/jobs/:id/saved` | Protected | Checks if specific job is saved by current candidate. |

### **Application Tracking Endpoints**

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/applications` | Protected | Records a new application position snapshot with default status `'applied'`. |
| `GET` | `/api/applications` | Protected | Lists candidate's applications with status filter (`applied`, `under_review`, `interview`, `offer`, `rejected`). |
| `GET` | `/api/applications/:id` | Protected | Retrieves single application details (Ownership strictly enforced). |
| `PATCH` | `/api/applications/:id` | Protected | Updates application `status` or `notes` (Ownership strictly enforced). |
| `DELETE` | `/api/applications/:id` | Protected | Deletes an application record (Ownership strictly enforced). |
| `GET` | `/api/users/dashboard-stats` | Protected | Aggregates live MongoDB counts for Saved Jobs, Applications, Interviews, and Offers. |

---

## 🔒 Authorization & Security Controls
1. **JWT Verification**: Every saved job and application operation requires a valid JWT token in `Authorization: Bearer <token>`.
2. **Derived User Identity**: Candidate ID is derived strictly from `req.user.id` on the server. `userId` in request body/params is ignored.
3. **Ownership Isolation**: Queries filter by `{ _id: id, userId: req.user.id }`. User A cannot view, modify, or delete User B's saved jobs or applications (returns 404 Not Found).
