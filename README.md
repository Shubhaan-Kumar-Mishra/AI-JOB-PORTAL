# AI Job Portal

A production-quality full-stack AI-powered job application platform built for local development and testing. Users can build profiles, upload resumes, extract and parse structured candidate data, search real job opportunities powered by the Adzuna API, save job positions, track job applications across workflow stages, receive Google Gemini AI compatibility scores and detailed match assessments, and manage their career pipeline.

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
- **AI Engine**: Google Gemini API (`@google/genai` SDK, Model: `gemini-3.6-flash`)
- **Email Service**: Resend API (Stage 7)

---

## 🤖 Stage 6 — Gemini AI Resume & Job Matching

### **Core Objective**
Integrates Google's official `@google/genai` SDK in the Node.js/Express backend to analyze compatibility between a candidate's uploaded resume document and target Adzuna job listings.

### **Architecture & Safety Directives**
1. **System Instructions**: Gemini acts as an objective, professional resume and job matching assistant.
2. **Strict Evaluation**: Compares explicitly present resume data against position requirements. Does NOT invent fake skills, experience, or qualifications.
3. **Privacy & Fairness Guardrails**: Does NOT infer or make decisions based on protected personal characteristics (age, gender, race, religion, disability, marital status, etc.). Uses *"Not found in the provided resume"* rather than assuming candidate lacks a skill.
4. **Structured JSON Output**: Validated against Zod schema (`aiJobMatchResponseSchema`).

---

## 📡 Gemini AI API Endpoint

### `POST /api/ai/job-match/:jobId`
- **Access**: Protected (`Authorization: Bearer <token>`)
- **Pre-requisite**: Candidate must have an uploaded resume document in MongoDB Atlas. Returns `HTTP 400 Bad Request` if no resume exists.

#### **Response Example**:
```json
{
  "success": true,
  "data": {
    "job": {
      "id": "5837138984",
      "title": "Lead Software Architect",
      "company": "Tech Solutions Pvt Ltd"
    },
    "analysis": {
      "matchScore": 87,
      "overallAssessment": "Strong candidate for this position based on technical skills in React, Node.js, TypeScript, and database architecture.",
      "matchingSkills": ["React", "TypeScript", "Node.js", "Express", "MongoDB", "REST API", "Docker", "Git"],
      "missingSkills": ["Kubernetes"],
      "relevantExperience": ["Full Stack Software Architect"],
      "relevantProjects": ["AI Job Portal"],
      "strengths": ["Strong TypeScript and Node.js proficiency", "Hands-on Mongoose database architecture experience"],
      "concerns": ["Kubernetes container orchestration experience not found in resume"],
      "improvementSuggestions": ["Highlight cloud deployment projects and containerization experience on your resume"],
      "recommendation": "strong_match"
    }
  }
}
```

---

## 🔒 Security & Privacy Strategy
1. **Gemini API Key**: `GEMINI_API_KEY` exists strictly in `backend/.env` and is never exposed to the frontend, logs, or error responses.
2. **Minimal Job-Relevant Payload**: Sanitizes job listing data (title, company, description, location) and resume payload (skills, education, experience, projects). Excludes passwords, tokens, API keys, and sensitive personal attributes.
3. **AI Disclaimer**: All match results include the mandatory disclaimer:
   > *"This score is an AI-generated estimate based on the information in your resume and this job listing. It is not a hiring prediction."*
