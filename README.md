# AI Job Portal

A production-quality full-stack AI-powered job application platform. Users can build profiles, upload resumes, extract and parse structured candidate data, search real job opportunities powered by the Adzuna API, save job positions, track job applications across workflow stages, and receive Google Gemini AI compatibility scores and detailed match assessments.

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
- **Dev Runner**: `tsx`

### **Database & External Services**
- **Database**: MongoDB Atlas (via Mongoose)
- **Authentication**: JWT & bcryptjs password hashing
- **Job Search Provider**: Adzuna API (India Market `in`)
- **Text Extraction**: `pdf-parse` (PDF) & `mammoth` (DOCX) in-memory
- **AI Engine**: Google Gemini API (`@google/genai` SDK, Model: `gemini-2.5-flash`)

---

## ⚙️ Environment Variables

Copy `.env.example` to `backend/.env` and populate all values:

```
PORT=5001
MONGODB_URI=            # MongoDB Atlas or local connection string
JWT_SECRET=             # Random 32+ character secret
ADZUNA_APP_ID=          # From https://developer.adzuna.com
ADZUNA_APP_KEY=         # From https://developer.adzuna.com
GEMINI_API_KEY=         # From https://aistudio.google.com/app/apikey
GEMINI_MODEL=gemini-2.5-flash
```

> **IMPORTANT**: Never commit `.env` or `backend/.env`. These files are in `.gitignore`. The `.env.example` files contain only empty placeholders.

---

## 🤖 Stage 6 — Gemini AI Resume & Job Matching

### **API Endpoint**

```
POST /api/ai/job-match/:jobId
Authorization: Bearer <token>
```

- **Protected**: Requires valid JWT.
- **Pre-requisite**: Candidate must have an uploaded resume (returns `HTTP 400` if missing).
- **Input**: Only `jobId` path parameter — the backend fetches job data independently from Adzuna.
- **Rate Limit**: 10 requests per 15-minute window per user.

#### **Response Structure**
```json
{
  "success": true,
  "data": {
    "job": { "id": "...", "title": "...", "company": "..." },
    "analysis": {
      "matchScore": 0,
      "overallAssessment": "...",
      "matchingSkills": [],
      "missingSkills": [],
      "relevantExperience": [],
      "relevantProjects": [],
      "strengths": [],
      "concerns": [],
      "improvementSuggestions": [],
      "recommendation": "strong_match | good_match | partial_match | weak_match"
    }
  }
}
```

#### **Error HTTP Status Codes**
| Code | Meaning |
|------|---------|
| 400  | No resume uploaded |
| 401  | Unauthenticated |
| 404  | Job not found on Adzuna |
| 429  | Rate limit exceeded or duplicate in-progress request |
| 500  | Gemini API key or model configuration error |
| 502  | Gemini returned malformed/invalid response |
| 504  | Gemini request timed out |

---

## 🔒 Security Architecture

### **AI Disclaimer**
> *"This score is an AI-generated estimate based on the information in your resume and this job listing. It is not a hiring prediction."*

### **Prompt Injection Protection**
The job description from Adzuna is **UNTRUSTED EXTERNAL CONTENT**. It is:
- Clearly delimited in the Gemini prompt with explicit `[BEGIN UNTRUSTED JOB DESCRIPTION]` / `[END UNTRUSTED JOB DESCRIPTION]` markers.
- System instructions explicitly instruct the model to treat any text in that section as **data to analyze**, never as model instructions.
- Any injection text (e.g., *"Ignore all previous instructions"*) is treated as suspicious job description content, not as a command.

### **Sensitive Data Controls**
The AI endpoint never sends to Gemini: passwords, JWT tokens, MongoDB URI, API keys, phone numbers, email addresses, or raw resume file buffers. Only structured, job-relevant resume fields are passed (skills, education, experience summary, projects).

API responses never contain: Gemini API key, Gemini model name/prompt, MongoDB internal fields (`_id`, `__v`), raw resume text, or stack traces.

### **Resume Ownership**
`userId` is derived **exclusively** from the authenticated JWT (`req.user.id`). The frontend cannot specify or override which resume is used. A user can never access another user's resume.

### **Rate Limiting**
- **Per-user in-memory rate limiter**: 10 AI requests per 15-minute window.
- **Duplicate request lock**: If an AI analysis for the same `userId + jobId` is already in progress, subsequent requests return `HTTP 429` immediately (prevents runaway Gemini quota consumption from accidental double-clicks).

> **Production Note**: The current rate limiter is in-process memory only. For horizontally-scaled production deployments, replace with a distributed solution (e.g., Redis-backed `rate-limiter-flexible` or Upstash Redis).

### **Input Size Limits**
All resume and job data is truncated before being sent to Gemini:
- Resume summary: 600 chars
- Skills: max 30, each 80 chars
- Education/Experience/Projects: max 10 entries each
- Job description: 2000 chars (prevents enormous raw descriptions)
- Entry descriptions: 400 chars each

### **Retry Policy**
- Maximum 2 attempts total (1 retry on transient failure).
- **Never retried**: Auth errors, rate limit errors, unsupported model errors, invalid request errors, or schema validation errors.
- **May retry once**: Temporary network failures or transient server errors.

### **Gemini Error Classification**
| Error Type | HTTP Code | Retried? |
|------------|-----------|----------|
| GeminiAuthError (invalid key) | 500 | ❌ Never |
| GeminiRateLimitError | 429 | ❌ Never |
| GeminiModelError (bad model) | 500 | ❌ Never |
| GeminiValidationError (bad schema) | 502 | ❌ Never |
| GeminiTimeoutError | 504 | ✅ Once |
| Transient network failure | 500 | ✅ Once |

---

## 🚀 Local Development

```bash
# Install dependencies
npm install

# Start backend (port 5001)
npm run dev:backend

# Start frontend (port 5173)
npm run dev:frontend

# Build full project
npm run build
```
