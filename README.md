# AI Job Portal

A production-quality full-stack AI-powered job application platform. Users can build profiles, upload resumes, extract and parse structured candidate data, search real job opportunities powered by the Adzuna API, save job positions, track job applications across workflow stages, receive Resend transactional email notifications, and receive Google Gemini AI compatibility scores and detailed match assessments.

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
- **Transactional Email**: Resend (`resend` SDK v6.x)

---

## ⚙️ Environment Variables

Copy `.env.example` to `backend/.env` and populate all values:

```
PORT=5001
MONGODB_URI=           # MongoDB Atlas or local connection string
JWT_SECRET=            # Random 32+ character secret
ADZUNA_APP_ID=         # From https://developer.adzuna.com
ADZUNA_APP_KEY=        # From https://developer.adzuna.com
GEMINI_API_KEY=        # From https://aistudio.google.com/app/apikey
GEMINI_MODEL=gemini-2.5-flash
RESEND_API_KEY=        # From https://resend.com/api-keys
RESEND_FROM_EMAIL=     # Must be a verified sender/domain in Resend
RESEND_FROM_NAME=AI Job Portal
FRONTEND_URL=http://localhost:5173
```

> **IMPORTANT**: Never commit `.env` or `backend/.env`. These files are in `.gitignore`. The `.env.example` files contain only empty placeholders — no real credentials are ever committed.

---

## 📧 Stage 7 — Resend Transactional Email Notifications

### **Overview**

Transactional emails are sent automatically on two events:

| Event | Trigger | Email Subject |
|-------|---------|---------------|
| Application Created | `POST /api/applications` → MongoDB save succeeds | `Application Submitted — {jobTitle}` |
| Status Changed | `PATCH /api/applications/:id` → status actually changes | `Application Status Updated — {jobTitle}` |

### **Email Events**

#### 1. Application Confirmation
- **Trigger**: Successful application creation.
- **Content**: Job title, company, location, application date, status badge, CTA button linking to `/applications/{applicationId}`.
- **Does NOT trigger**: Duplicate applications (409), read requests (GET), notes-only updates.

#### 2. Application Status Update
- **Trigger**: `PATCH /api/applications/:id` where `newStatus !== oldStatus`.
- **Content**: Job title, company, previous status, new status, updated timestamp, CTA button.
- **Does NOT trigger**: Same-status updates, notes-only updates, delete operations.

### **Email Failure Behavior**

> **Critical Design Rule**: Email failure NEVER breaks a successful database operation.

If MongoDB saves the application but Resend fails:
- The application remains saved in MongoDB.
- The API returns HTTP 201 with `success: true`.
- The response includes `emailNotification: { sent: false }`.
- The failure is safely logged server-side (no credentials or user data logged).
- Raw Resend error details are NEVER exposed to the frontend.

### **Idempotency**

| Email Type | Idempotency Key |
|------------|----------------|
| Application confirmation | `application-created:{applicationId}` |
| Status change | `application-status:{applicationId}:{oldStatus}:{newStatus}` |

Idempotency keys prevent duplicate emails when requests are retried.

### **Sender Verification**

The `RESEND_FROM_EMAIL` sender **must be verified** in your Resend dashboard. If the sender is unverified:
- The email service detects the 422/unverified error from Resend.
- It logs `resend_sender_unverified` safely (no key logged).
- The application operation proceeds and succeeds.

> For local development testing: Use a Resend-verified sender email. If using the `@example.com` placeholder, Resend will reject the send — the application is still saved correctly.

### **Security Properties**

- **Recipient**: Always fetched from MongoDB using the authenticated JWT `userId` — never from request body.
- **API key**: Never logged, never returned in any API response, only used server-side.
- **Rate limiting**: Inherits per-endpoint protections. No email sent on GET requests.
- **No PII in logs**: Logs contain only non-sensitive event names (e.g., `resend_auth_error`).

### **Local Testing Instructions**

1. Add your credentials to `backend/.env`:
   ```
   RESEND_API_KEY=re_...
   RESEND_FROM_EMAIL=your_verified@email.com
   RESEND_FROM_NAME=AI Job Portal
   FRONTEND_URL=http://localhost:5173
   ```
2. Start backend: `npm run dev:backend`
3. Register a user with a real email address.
4. Create an application via `POST /api/applications`.
5. Update status via `PATCH /api/applications/:id` with `{ "status": "interview" }`.
6. Check your inbox for both emails.

---

## 🤖 Stage 6 — Gemini AI Resume & Job Matching

### **API Endpoint**

```
POST /api/ai/job-match/:jobId
Authorization: Bearer <token>
```

- **Protected**: Requires valid JWT.
- **Pre-requisite**: Candidate must have an uploaded resume (returns `HTTP 400` if missing).
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

---

## 🔒 Security Architecture

### **AI Disclaimer**
> *"This score is an AI-generated estimate based on the information in your resume and this job listing. It is not a hiring prediction."*

### **Prompt Injection Protection**
Job descriptions are treated as UNTRUSTED EXTERNAL CONTENT, explicitly delimited in the Gemini prompt and instructed to be treated as data-only.

### **Sensitive Data Controls**
No passwords, JWT tokens, MongoDB URIs, API keys, phone numbers, emails, or raw resume file buffers are ever sent to Gemini or returned to the frontend.

### **Resume Ownership**
`userId` is derived **exclusively** from the authenticated JWT. A user can never access another user's resume.

### **Email Security**
- Recipient email always fetched from MongoDB using JWT `userId`.
- `RESEND_API_KEY` never logged, returned, or exposed.
- Raw error messages from Resend never forwarded to the client.

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
