import { Resume } from '../models/Resume.js';
import { Application } from '../models/Application.js';
import { SavedJob } from '../models/SavedJob.js';
import { fetchAdzunaJobs, StandardJob } from './adzuna.service.js';
import {
  generateJobRecommendations,
  ControlledResumePayload,
  ControlledJobPayload,
  CandidatePreferenceSignals,
} from './gemini.service.js';

// ─── Custom Error for Missing Resume ──────────────────────────────────────────
export class NoResumeError extends Error {
  constructor() {
    super('Please upload a resume to receive personalized job recommendations.');
    this.name = 'NoResumeError';
  }
}

// ─── Enriched Recommendation Output Format ───────────────────────────────────
export interface EnrichedJobRecommendation {
  jobId: string;
  matchScore: number;
  recommendationReason: string;
  matchingSkills: string[];
  missingSkills: string[];
  highlights: string[];
  job: {
    id: string;
    title: string;
    company: { name: string };
    location: { displayName: string };
    salaryMin: number | null;
    salaryMax: number | null;
    salaryIsPredicted: boolean;
    url: string;
    created: string;
    category?: string;
    contractType?: string | null;
    contractTime?: string | null;
  };
}

// ─── In-Memory Cache (TTL: 30 minutes) ────────────────────────────────────────
interface CacheEntry {
  recommendations: EnrichedJobRecommendation[];
  cachedAt: number;
}

const recommendationCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Clear or invalidate cache for a specific user.
 */
export function invalidateUserRecommendationCache(userId: string): void {
  for (const key of recommendationCache.keys()) {
    if (key.startsWith(`recommendations:${userId}:`)) {
      recommendationCache.delete(key);
    }
  }
}

/**
 * Deterministic Skill & Keyword Relevance Scorer for candidate job filtering.
 */
function scoreJobRelevance(job: StandardJob, skills: string[], roleKeywords: string[]): number {
  let score = 0;
  const text = `${job.title} ${job.description} ${job.category || ''}`.toLowerCase();

  // Skill overlap (+5 points per matching skill)
  for (const skill of skills) {
    if (skill.length > 1 && text.includes(skill.toLowerCase())) {
      score += 5;
    }
  }

  // Preference role keyword match (+10 points)
  for (const kw of roleKeywords) {
    if (kw.length > 2 && text.includes(kw.toLowerCase())) {
      score += 10;
    }
  }

  return score;
}

/**
 * Primary Recommendation Orchestrator
 */
export async function getPersonalizedRecommendations(
  userId: string,
  options: { forceRefresh?: boolean } = {}
): Promise<EnrichedJobRecommendation[]> {
  // 1. Fetch user's resume
  const resumeDoc = await Resume.findOne({ userId }).lean();
  if (!resumeDoc || !resumeDoc.parsedData) {
    throw new NoResumeError();
  }

  const parsedResume = resumeDoc.parsedData;
  const resumeUpdatedAtMs = resumeDoc.updatedAt
    ? new Date(resumeDoc.updatedAt).getTime()
    : Date.now();

  const cacheKey = `recommendations:${userId}:${resumeUpdatedAtMs}`;

  // 2. Check in-memory cache unless forceRefresh requested
  if (!options.forceRefresh) {
    const cached = recommendationCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached.recommendations;
    }
  }

  // 3. Fetch user's applications (for exclusion & preference signals)
  const applications = await Application.find({ userId }).select('jobId jobTitle companyName').lean();
  const appliedJobIds = new Set<string>(applications.map((a) => a.jobId));
  const appliedJobTitles = applications.map((a) => a.jobTitle);
  const appliedJobCategories: string[] = [];

  // 4. Fetch user's saved jobs (preference signals)
  const savedJobs = await SavedJob.find({ userId }).select('jobId title companyName location').lean();
  const savedJobTitles = savedJobs.map((s) => s.title);
  const savedJobCategories: string[] = [];

  // 5. Build Controlled Candidate Profile (NO PII: no email, phone, password, JWT, or credentials)
  const controlledResume: ControlledResumePayload = {
    summary: parsedResume.summary || null,
    skills: parsedResume.skills || [],
    education: (parsedResume.education || []).map((e) => ({
      institution: e.institution || null,
      degree: e.degree || null,
      field: e.field || null,
      startDate: e.startDate || null,
      endDate: e.endDate || null,
    })),
    experience: (parsedResume.experience || []).map((e) => ({
      company: e.company || null,
      position: e.position || null,
      startDate: e.startDate || null,
      endDate: e.endDate || null,
      description: e.description || null,
    })),
    projects: (parsedResume.projects || []).map((p) => ({
      name: p.name || null,
      description: p.description || null,
      technologies: p.technologies || [],
    })),
  };

  const preferenceSignals: CandidatePreferenceSignals = {
    savedJobTitles,
    savedJobCategories,
    appliedJobTitles,
    appliedJobCategories,
  };

  // 6. Build search queries for Adzuna pool
  const candidateSkills = controlledResume.skills;
  const primarySkillKeywords = candidateSkills.slice(0, 3);
  const preferenceRoleKeywords = [...savedJobTitles, ...appliedJobTitles]
    .slice(0, 3)
    .map((t) => t.split(' ')[0]);

  const searchKeywords = Array.from(
    new Set([...primarySkillKeywords, ...preferenceRoleKeywords])
  ).filter((k) => k && k.length > 2);

  const mainKeyword = searchKeywords.length > 0 ? searchKeywords[0] : 'Developer';

  // 7. Retrieve a manageable candidate pool from Adzuna (20–40 jobs)
  let adzunaPool: StandardJob[] = [];
  try {
    const primaryFetch = await fetchAdzunaJobs({
      keyword: mainKeyword,
      location: '',
      page: 1,
      resultsPerPage: 30,
      sortBy: 'relevance',
    });
    adzunaPool = primaryFetch.data.jobs || [];

    // If pool is small, fetch a second set using alternate keyword or page
    if (adzunaPool.length < 15 && searchKeywords.length > 1) {
      try {
        const secondaryFetch = await fetchAdzunaJobs({
          keyword: searchKeywords[1],
          location: '',
          page: 1,
          resultsPerPage: 20,
          sortBy: 'relevance',
        });
        const existingIds = new Set(adzunaPool.map((j) => j.id));
        for (const job of secondaryFetch.data.jobs) {
          if (!existingIds.has(job.id)) {
            adzunaPool.push(job);
          }
        }
      } catch {
        // Fallback silently if secondary fetch fails
      }
    }
  } catch (err: any) {
    console.warn('[RecommendationService] Adzuna pool fetch warning:', err?.message || err);
    adzunaPool = [];
  }

  // 8. Deterministic Filtering:
  // a) REMOVE jobs already applied to (userId + jobId)
  const unappliedPool = adzunaPool.filter((job) => !appliedJobIds.has(job.id));

  if (unappliedPool.length === 0) {
    return [];
  }

  // b) Score and rank remaining jobs by skill/keyword relevance
  const scoredPool = unappliedPool.map((job) => ({
    job,
    score: scoreJobRelevance(job, candidateSkills, [...savedJobTitles, ...appliedJobTitles]),
  }));

  scoredPool.sort((a, b) => b.score - a.score);

  // c) Keep top 12 candidate jobs max for Gemini evaluation (keeps Gemini payload light & fast)
  const candidateJobPool = scoredPool.slice(0, 12).map((item) => item.job);

  // Map candidate jobs to ControlledJobPayload format
  const controlledCandidateJobs: ControlledJobPayload[] = candidateJobPool.map((j) => ({
    id: j.id,
    title: j.title,
    company: j.company.name,
    location: j.location.displayName,
    category: j.category || 'General',
    description: j.description || 'No description provided.',
    contractType: j.contractType || null,
    contractTime: j.contractTime || null,
  }));

  // Create lookup map by jobId for fast post-processing
  const poolMap = new Map<string, StandardJob>();
  for (const job of candidateJobPool) {
    poolMap.set(job.id, job);
  }

  // 9. ONE Single Gemini Call for Ranking & Feedback Generation
  const geminiResult = await generateJobRecommendations(
    controlledResume,
    preferenceSignals,
    controlledCandidateJobs,
    userId
  );

  // 10. Post-Gemini Validation:
  // - Verify returned jobId belongs to the supplied candidate pool (discard unknown job IDs)
  // - Verify returned job was not applied to
  const validRecommendations: EnrichedJobRecommendation[] = [];

  for (const rec of geminiResult.recommendations) {
    // SECURITY GUARD: Reject hallucinated or unknown job IDs
    const matchedJob = poolMap.get(rec.jobId);
    if (!matchedJob) {
      console.warn(`[RecommendationService] Discarding unknown jobId returned by Gemini: ${rec.jobId}`);
      continue;
    }

    // SECURITY GUARD: Ensure job wasn't applied to
    if (appliedJobIds.has(rec.jobId)) {
      continue;
    }

    validRecommendations.push({
      jobId: rec.jobId,
      matchScore: rec.matchScore,
      recommendationReason: rec.recommendationReason,
      matchingSkills: rec.matchingSkills,
      missingSkills: rec.missingSkills,
      highlights: rec.highlights,
      job: {
        id: matchedJob.id,
        title: matchedJob.title,
        company: { name: matchedJob.company.name },
        location: { displayName: matchedJob.location.displayName },
        salaryMin: matchedJob.salary.min,
        salaryMax: matchedJob.salary.max,
        salaryIsPredicted: matchedJob.salary.isPredicted,
        url: matchedJob.url,
        created: matchedJob.created,
        category: matchedJob.category,
        contractType: matchedJob.contractType,
        contractTime: matchedJob.contractTime,
      },
    });
  }

  // Sort descending by matchScore
  validRecommendations.sort((a, b) => b.matchScore - a.matchScore);

  // Cap at 10 items max
  const finalRecommendations = validRecommendations.slice(0, 10);

  // 11. Cache result in memory
  recommendationCache.set(cacheKey, {
    recommendations: finalRecommendations,
    cachedAt: Date.now(),
  });

  return finalRecommendations;
}
