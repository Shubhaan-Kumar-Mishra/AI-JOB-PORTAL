import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { Resume } from '../models/Resume.js';
import {
  extractTextFromPdfBuffer,
  extractTextFromDocxBuffer,
  parseResumeText,
} from '../services/resumeParser.service.js';
import { invalidateUserRecommendationCache } from '../services/recommendation.service.js';

// Max file size limit: 10 MB
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * POST /api/resume
 * Protected endpoint to upload, extract, parse, and store a candidate resume.
 * Accepts multipart/form-data with field name 'resume'.
 */
export async function uploadResume(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, error: { message: 'Authentication required' } });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: { message: 'Resume file is required. Please attach a PDF or DOCX document.' } });
      return;
    }

    // 1. File Size Validation (<= 10 MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      res.status(400).json({
        success: false,
        error: { message: 'File size exceeds maximum allowed limit of 10 MB.' },
      });
      return;
    }

    // 2. File Extension & MIME Type Double Validation
    const originalName = file.originalname || 'resume';
    const ext = originalName.split('.').pop()?.toLowerCase();
    const mimeType = file.mimetype;

    const isPdf = ext === 'pdf' && mimeType === 'application/pdf';
    const isDocx =
      (ext === 'docx' || ext === 'doc') &&
      (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword' ||
        mimeType === 'application/octet-stream');

    if (!isPdf && !isDocx) {
      res.status(400).json({
        success: false,
        error: { message: 'Unsupported file format. Only text-based PDF (.pdf) and Word (.docx) resumes are accepted.' },
      });
      return;
    }

    const fileType: 'pdf' | 'docx' = isPdf ? 'pdf' : 'docx';

    // 3. In-Memory Text Extraction
    let rawText = '';
    if (fileType === 'pdf') {
      rawText = await extractTextFromPdfBuffer(file.buffer);
    } else {
      rawText = await extractTextFromDocxBuffer(file.buffer);
    }

    if (!rawText || rawText.length < 30) {
      res.status(400).json({
        success: false,
        error: { message: 'Could not extract readable text from this document. Please upload a text-based PDF or DOCX resume.' },
      });
      return;
    }

    // 4. Deterministic Heuristic Parsing
    const parsedData = parseResumeText(rawText);

    // Sanitize Original Filename to prevent path injection
    const sanitizedFileName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');

    // 5. Upsert Candidate Resume Record in MongoDB Atlas
    const resumeDoc = await Resume.findOneAndUpdate(
      { userId },
      {
        userId,
        fileName: sanitizedFileName,
        fileType,
        fileSize: file.size,
        rawText,
        parsedData,
      },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    // Invalidate recommendation cache so candidate immediately gets fresh recommendations
    invalidateUserRecommendationCache(userId.toString());

    res.status(200).json({
      success: true,
      message: 'Resume uploaded and parsed successfully',
      data: {
        resume: {
          id: resumeDoc._id,
          fileName: resumeDoc.fileName,
          fileType: resumeDoc.fileType,
          fileSize: resumeDoc.fileSize,
          parsedData: resumeDoc.parsedData,
          uploadedAt: resumeDoc.updatedAt || resumeDoc.createdAt,
        },
      },
    });
  } catch (error: any) {
    if (error.message?.includes('extract') || error.message?.includes('readable')) {
      res.status(400).json({ success: false, error: { message: error.message } });
      return;
    }
    next(error);
  }
}

/**
 * GET /api/resume
 * Protected endpoint to fetch current authenticated candidate's structured resume.
 */
export async function getResume(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, error: { message: 'Authentication required' } });
      return;
    }

    const resume = await Resume.findOne({ userId }).select('-rawText').lean();

    if (!resume) {
      res.status(404).json({
        success: false,
        error: { message: 'No resume document found for your account.' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        resume: {
          id: resume._id,
          fileName: resume.fileName,
          fileType: resume.fileType,
          fileSize: resume.fileSize,
          parsedData: resume.parsedData,
          uploadedAt: resume.updatedAt || resume.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/resume
 * Protected endpoint to delete candidate's resume document.
 */
export async function deleteResume(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, error: { message: 'Authentication required' } });
      return;
    }

    const deleted = await Resume.findOneAndDelete({ userId });

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: { message: 'No resume document found to delete.' },
      });
      return;
    }

    // Invalidate recommendation cache
    invalidateUserRecommendationCache(userId.toString());

    res.status(200).json({
      success: true,
      message: 'Resume document deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/resume/status
 * Protected endpoint to check if candidate has an uploaded resume.
 */
export async function getResumeStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, error: { message: 'Authentication required' } });
      return;
    }

    const resume = await Resume.findOne({ userId }).select('fileName fileType fileSize updatedAt createdAt').lean();

    if (!resume) {
      res.status(200).json({
        success: true,
        data: {
          hasResume: false,
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        hasResume: true,
        fileName: resume.fileName,
        fileType: resume.fileType,
        fileSize: resume.fileSize,
        uploadedAt: resume.updatedAt || resume.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}
