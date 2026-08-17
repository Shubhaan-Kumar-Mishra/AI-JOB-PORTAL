import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env.js';
import { aiJobMatchResponseSchema, AIJobMatchResponse } from '../validators/aiValidators.js';

export interface ControlledJobPayload {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  category?: string;
  contractType?: string | null;
  contractTime?: string | null;
}

export interface ControlledResumePayload {
  summary: string | null;
  skills: string[];
  education: Array<{
    institution: string | null;
    degree: string | null;
    field: string | null;
    startDate: string | null;
    endDate: string | null;
  }>;
  experience: Array<{
    company: string | null;
    position: string | null;
    startDate: string | null;
    endDate: string | null;
    description: string | null;
  }>;
  projects: Array<{
    name: string | null;
    description: string | null;
    technologies: string[];
  }>;
}

const SYSTEM_INSTRUCTION = `You are a professional resume and job matching assistant.
Compare the provided candidate RESUME against the target JOB LISTING and compute an objective compatibility evaluation.

CRITICAL DIRECTIVES & BOUNDARIES:
1. Rely ONLY on explicit job-relevant information present in the resume and job listing.
2. Do NOT invent skills, experience, qualifications, or projects that are not supported by the text.
3. Do NOT make hiring decisions or interview guarantees.
4. Do NOT infer or evaluate protected characteristics (such as age, gender, race, ethnicity, religion, disability, marital status, or political views).
5. Distinguish clearly between:
   - EXPLICIT MATCH: Skill or experience is clearly present in the resume.
   - PARTIAL MATCH: Related skill or experience is present.
   - NOT FOUND: Required skill or experience was not found in the provided resume.
6. When a skill is absent, state "Not found in the provided resume" rather than "Candidate lacks skill".

OUTPUT REQUIREMENTS:
Return a clean, strict JSON object with EXACTLY the following structure:
{
  "matchScore": number (integer between 0 and 100 representing job fit percentage),
  "overallAssessment": string (2-3 concise summary sentences of overall match),
  "matchingSkills": string[] (array of technical and domain skills explicitly present in both),
  "missingSkills": string[] (array of required job skills not found in candidate resume),
  "relevantExperience": string[] (array of key work experience items matching the job),
  "relevantProjects": string[] (array of candidate projects relevant to the role),
  "strengths": string[] (array of candidate's strongest qualifications for this role),
  "concerns": string[] (array of areas where resume evidence is missing or weak),
  "improvementSuggestions": string[] (actionable, concrete advice for candidate to enhance resume for this role),
  "recommendation": string ("strong_match" | "good_match" | "partial_match" | "weak_match")
}`;

/**
 * Analyzes compatibility between a candidate resume and a target job listing using Google Gemini AI.
 */
export async function analyzeResumeJobMatch(
  resumeData: ControlledResumePayload,
  jobData: ControlledJobPayload
): Promise<AIJobMatchResponse> {
  if (!config.geminiApiKey) {
    throw new Error('Gemini API key is not configured on the server. Please check environment configuration.');
  }

  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
  const modelName = config.geminiModel || 'gemini-3.6-flash';

  const userPrompt = `JOB LISTING:
Title: ${jobData.title}
Company: ${jobData.company}
Location: ${jobData.location}
Category: ${jobData.category || 'General'}
Contract: ${jobData.contractType || 'Full-Time'} (${jobData.contractTime || 'Permanent'})
Description:
${jobData.description}

---
CANDIDATE RESUME DATA:
Summary: ${resumeData.summary || 'None provided'}
Skills: ${resumeData.skills.length > 0 ? resumeData.skills.join(', ') : 'None listed'}
Education: ${JSON.stringify(resumeData.education)}
Experience: ${JSON.stringify(resumeData.experience)}
Projects: ${JSON.stringify(resumeData.projects)}

Analyze compatibility and respond strictly in JSON matching the specified schema.`;

  // Attempt up to 2 calls for transient JSON parse recovery
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: userPrompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });

      const responseText = response.text ? response.text.trim() : '';
      if (!responseText) {
        throw new Error('Empty response received from Gemini AI model.');
      }

      const jsonParsed = JSON.parse(responseText);
      const validated = aiJobMatchResponseSchema.parse(jsonParsed);
      return validated;
    } catch (err: any) {
      lastError = err;
      if (attempt === 1) {
        console.warn(`[Gemini AI Retry] Attempt 1 failed (${err.message}). Retrying once...`);
      }
    }
  }

  throw new Error(`Gemini AI analysis failed: ${lastError?.message || 'Invalid output format'}`);
}
