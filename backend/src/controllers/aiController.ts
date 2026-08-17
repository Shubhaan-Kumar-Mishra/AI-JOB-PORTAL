import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { Resume } from '../models/Resume.js';
import { fetchAdzunaJobById } from '../services/adzuna.service.js';
import {
  analyzeResumeJobMatch,
  ControlledJobPayload,
  ControlledResumePayload,
} from '../services/gemini.service.js';

/**
 * POST /api/ai/job-match/:jobId
 * Protected endpoint to perform AI compatibility analysis between current candidate's resume and specified job position.
 */
export async function analyzeJobMatchHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, error: { message: 'Authentication required' } });
      return;
    }

    const { jobId } = req.params;
    if (!jobId) {
      res.status(400).json({ success: false, error: { message: 'Job ID parameter is required' } });
      return;
    }

    // 1. Check whether candidate has uploaded a resume in Stage 5
    const resumeDoc = await Resume.findOne({ userId }).lean();
    if (!resumeDoc || !resumeDoc.parsedData) {
      res.status(400).json({
        success: false,
        message: 'Please upload a resume before analyzing your job match.',
        error: { message: 'No resume document found for your profile. Please upload a PDF or DOCX resume on the Resume page first.' },
      });
      return;
    }

    // 2. Fetch target job listing details from Adzuna service
    let jobDetail;
    try {
      jobDetail = await fetchAdzunaJobById(jobId);
    } catch (err: any) {
      res.status(404).json({
        success: false,
        error: { message: `Target job position (${jobId}) could not be retrieved from Adzuna API.` },
      });
      return;
    }

    // 3. Construct sanitized controlled job payload (no credentials or tokens)
    const controlledJob: ControlledJobPayload = {
      id: jobDetail.id,
      title: jobDetail.title,
      company: jobDetail.company?.name || 'Company',
      location: jobDetail.location?.displayName || 'Location Not Specified',
      description: jobDetail.description || 'No detailed description provided.',
      category: jobDetail.category || 'General',
      contractType: jobDetail.contractType || null,
      contractTime: jobDetail.contractTime || null,
    };

    // 4. Construct sanitized controlled resume payload
    const parsed = resumeDoc.parsedData;
    const controlledResume: ControlledResumePayload = {
      summary: parsed.summary || null,
      skills: parsed.skills || [],
      education: (parsed.education || []).map((e) => ({
        institution: e.institution || null,
        degree: e.degree || null,
        field: e.field || null,
        startDate: e.startDate || null,
        endDate: e.endDate || null,
      })),
      experience: (parsed.experience || []).map((e) => ({
        company: e.company || null,
        position: e.position || null,
        startDate: e.startDate || null,
        endDate: e.endDate || null,
        description: e.description || null,
      })),
      projects: (parsed.projects || []).map((p) => ({
        name: p.name || null,
        description: p.description || null,
        technologies: p.technologies || [],
      })),
    };

    // 5. Invoke Gemini AI Service
    const analysis = await analyzeResumeJobMatch(controlledResume, controlledJob);

    res.status(200).json({
      success: true,
      data: {
        job: {
          id: controlledJob.id,
          title: controlledJob.title,
          company: controlledJob.company,
        },
        analysis,
      },
    });
  } catch (error: any) {
    if (error.message?.includes('Gemini API key')) {
      res.status(500).json({
        success: false,
        error: { message: 'Gemini AI service is not properly configured on server.' },
      });
      return;
    }
    next(error);
  }
}
