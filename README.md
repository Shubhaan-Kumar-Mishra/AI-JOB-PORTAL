# AI Job Portal

A production-quality full-stack AI-powered job application platform built for local development and testing. Users can build profiles, upload resumes, extract and parse structured candidate data, search real job opportunities powered by the Adzuna API, save job positions, track job applications across workflow stages, receive Google Gemini AI compatibility scores (Stage 6), and manage their career pipeline.

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
- **Text Extraction**: `pdf-parse` (PDF) & `mammoth` (DOCX) in-memory
- **AI Engine**: Google Gemini API (Stage 6)
- **Email Service**: Resend API (Stage 7)

---

## 📄 Stage 5 — Resume Upload & Text Extraction

### **Features**
1. **Supported File Formats**: PDF (`.pdf`) and Word (`.docx`). Rejects `.exe`, `.zip`, images, `.html`, `.js`, or arbitrary unsupported MIME types with HTTP 400.
2. **File Size Limit**: Strict 10 MB maximum limit (enforced at Multer middleware level and controller level).
3. **In-Memory Storage**: Uploaded files are processed strictly in-memory buffers (`multer.memoryStorage()`) without persistent disk storage.
4. **Deterministic Heuristic Parsing**: Regular expressions and section headers automatically extract candidate metadata:
   - Contact Info: Name, Email, Phone Number, Location
   - Professional Summary / Objective
   - Technical Skill chips (e.g. React, TypeScript, Node.js, Express, MongoDB, Docker, Git)
   - Education Timeline (Degrees, Institutions, Dates)
   - Work Experience Timeline (Positions, Companies, Dates, Descriptions)
   - Key Projects (Names, Descriptions)
5. **Resume Lifecycle & Replacement**: 1 active resume per candidate (`userId` unique index). Uploading a new file updates/replaces existing parsed data.

---

## 📡 Resume API Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/resume` | Protected | Accepts `multipart/form-data` with field `resume`. Validates format, size (10MB max), extracts text in-memory, parses structured JSON, and upserts candidate document. |
| `GET` | `/api/resume` | Protected | Retrieves current authenticated candidate's structured resume document (omits raw text by default). |
| `DELETE` | `/api/resume` | Protected | Deletes candidate's resume document from MongoDB Atlas. |
| `GET` | `/api/resume/status` | Protected | Returns candidate resume status (`hasResume`, `fileName`, `fileType`, `fileSize`, `uploadedAt`). |

---

## 🔒 Security & Privacy Strategy
1. **JWT Verification**: Every `/api/resume` endpoint is protected by `authMiddleware`.
2. **Derived User Identity**: Candidate ID is derived strictly from `req.user.id` on the server. `userId` in request body/params is ignored.
3. **Double Extension & MIME Validation**: Verifies extension (`.pdf`, `.docx`) AND MIME type (`application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`).
4. **Scanned PDF Handling**: Rejects scanned or unreadable PDFs with < 30 extractable characters with a clean error message.
5. **No File Leakage**: Zero uploaded files or raw resume texts are logged to stdout/stderr or stored on server disk.
