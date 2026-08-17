import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Banknote,
  Briefcase,
  ExternalLink,
  Calendar,
  Sparkles,
  Loader2,
  Bookmark,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  Upload,
  AlertTriangle,
  Award,
  Lightbulb,
  Check,
  X,
  FileText,
} from 'lucide-react';
import {
  getJobDetailsApi,
  saveJobApi,
  removeSavedJobApi,
  checkJobSavedApi,
  createApplicationApi,
  getResumeStatusApi,
  analyzeJobMatchApi,
  StandardJob,
  AIAnalysisResult,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

export const JobDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [job, setJob] = useState<StandardJob | null>(null);
  const [attribution, setAttribution] = useState<{ text: string; link: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Saved Job State
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Application State
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [appSuccessMsg, setAppSuccessMsg] = useState<string | null>(null);

  // Resume & Gemini AI Match State
  const [hasResume, setHasResume] = useState<boolean | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchDetails = async () => {
      try {
        setIsLoading(true);
        setErrorMsg(null);
        const res = await getJobDetailsApi(id);

        if (res.success && res.data?.job) {
          setJob(res.data.job);
          setAttribution(res.data.attribution);
        } else {
          setErrorMsg('Failed to load job position details.');
        }
      } catch (err: any) {
        console.error('Job details error:', err);
        setErrorMsg(err.response?.data?.error?.message || 'Job position not found or unavailable.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();

    if (isAuthenticated) {
      checkJobSavedApi(id).then((res) => {
        if (res.success && res.data) {
          setIsSaved(res.data.saved);
        }
      });

      getResumeStatusApi().then((res) => {
        if (res.success && res.data) {
          setHasResume(res.data.hasResume);
        }
      });
    }
  }, [id, isAuthenticated]);

  const handleToggleSave = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!job) return;

    try {
      setIsSaving(true);
      if (isSaved) {
        await removeSavedJobApi(job.id);
        setIsSaved(false);
      } else {
        await saveJobApi(job.id, {
          title: job.title,
          companyName: job.company?.name,
          location: job.location?.displayName,
          jobUrl: job.url,
          salary: job.salary,
        });
        setIsSaved(true);
      }
    } catch (err: any) {
      console.error('Toggle save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTrackApplication = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!job) return;

    try {
      setIsApplying(true);
      setAppSuccessMsg(null);
      await createApplicationApi({
        jobId: job.id,
        jobTitle: job.title,
        companyName: job.company?.name,
        location: job.location?.displayName,
        jobUrl: job.url,
      });
      setAppSuccessMsg('Position added to your Applications tracker!');
    } catch (err: any) {
      if (err.response?.status === 409) {
        setAppSuccessMsg('Already tracking this application in your pipeline.');
      } else {
        setAppSuccessMsg('Failed to track application.');
      }
    } finally {
      setIsApplying(false);
    }
  };

  const handleAnalyzeMatch = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!job) return;

    // Guard: prevent re-entry while a request is already running (defensive; button is also disabled)
    if (isAnalyzing) return;

    if (hasResume === false) {
      setAiError('Please upload your resume first on the Resume page before analyzing your job match.');
      return;
    }

    try {
      setIsAnalyzing(true);
      setAiError(null);
      setAiResult(null);

      const res = await analyzeJobMatchApi(job.id);
      if (res.success && res.data?.analysis) {
        setAiResult(res.data.analysis);
      } else {
        setAiError(res.message || 'Failed to analyze job match.');
      }
    } catch (err: any) {
      const status: number | undefined = err.response?.status;
      const serverMsg: string =
        err.response?.data?.error?.message || err.response?.data?.message || '';

      if (
        serverMsg.toLowerCase().includes('upload a resume') ||
        serverMsg.toLowerCase().includes('please upload a resume')
      ) {
        setHasResume(false);
        setAiError('Please upload a resume on the Resume page before analyzing your match.');
      } else if (status === 429) {
        setAiError(
          serverMsg || 'Too many AI requests. Please wait a moment before analyzing again.'
        );
      } else if (status === 504) {
        setAiError('AI analysis timed out. Please try again in a moment.');
      } else if (status === 502) {
        setAiError('AI service returned an unexpected response format. Please try again.');
      } else if (status === 500) {
        setAiError('AI service is currently unavailable. Please try again later.');
      } else if (status === 404) {
        setAiError('Job position not found. It may have been removed from Adzuna.');
      } else if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
        setAiError('Request timed out. Please check your connection and try again.');
      } else {
        setAiError(serverMsg || 'Gemini AI analysis failed. Please try again.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatSalary = (min: number | null, max: number | null, isPredicted: boolean) => {
    if (!min && !max) return 'Salary not disclosed';
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });

    let str = '';
    if (min && max) str = `${formatter.format(min)} - ${formatter.format(max)}`;
    else if (min) str = `From ${formatter.format(min)}`;
    else if (max) str = `Up to ${formatter.format(max)}`;

    if (isPredicted) str += ' (Estimated)';
    return str;
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (e) {
      return 'Recently posted';
    }
  };

  const getRecommendationBadge = (rec: string) => {
    switch (rec) {
      case 'strong_match':
        return { label: 'Strong Match', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'good_match':
        return { label: 'Good Match', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'partial_match':
        return { label: 'Partial Match', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      default:
        return { label: 'Weak Match', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          <span className="text-sm font-medium text-slate-400">Loading position details...</span>
        </div>
      </div>
    );
  }

  if (errorMsg || !job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Job Position Not Found</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">{errorMsg || 'This listing may have expired or been removed.'}</p>
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Job Search
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Link */}
      <Link
        to="/jobs"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Job Search Results
      </Link>

      {/* Main Job Card */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20">
              <Briefcase className="w-3.5 h-3.5" /> {job.category || 'Technology'}
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{job.title}</h1>
            <p className="text-base font-bold text-slate-300 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-400" /> {job.company?.name || 'Company Name Withheld'}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              disabled={isSaving}
              onClick={handleToggleSave}
              className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all inline-flex items-center gap-2 border ${
                isSaved
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
              )}
              {isSaved ? 'Saved Position' : 'Save Job'}
            </button>

            <button
              disabled={isApplying}
              onClick={handleTrackApplication}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all inline-flex items-center gap-2"
            >
              {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4 text-brand-400" />}
              Track Application
            </button>

            <button
              disabled={isAnalyzing}
              onClick={handleAnalyzeMatch}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-500 hover:to-accent-500 text-white font-bold text-xs shadow-lg shadow-brand-500/20 transition-all inline-flex items-center gap-2 disabled:opacity-60"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Analyzing with Gemini AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Analyze My Match
                </>
              )}
            </button>

            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all inline-flex items-center gap-2"
            >
              Apply on Company Site <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {appSuccessMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> {appSuccessMsg}
          </div>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand-400" /> Location
            </span>
            <p className="font-bold text-white truncate">{job.location?.displayName || 'India'}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-emerald-400" /> Salary
            </span>
            <p className="font-bold text-white">
              {formatSalary(job.salary?.min, job.salary?.max, job.salary?.isPredicted)}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-purple-400" /> Contract
            </span>
            <p className="font-bold text-white uppercase">{job.contractType || 'Full Time'}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-400" /> Posted Date
            </span>
            <p className="font-bold text-white">{formatDate(job.created)}</p>
          </div>
        </div>

        {/* Gemini AI Error / No Resume Prompt */}
        {aiError && (
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-300 text-xs font-medium">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>{aiError}</span>
            </div>
            {hasResume === false && (
              <Link
                to="/resume"
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors shrink-0 inline-flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" /> Upload Resume
              </Link>
            )}
          </div>
        )}

        {/* Gemini AI Match Score & Detailed Breakdown Card */}
        {aiResult && (
          <div className="glass-panel p-8 rounded-3xl border border-brand-500/30 bg-slate-900/80 space-y-8 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-500 flex flex-col items-center justify-center text-white shadow-xl shadow-brand-500/20">
                  <span className="text-2xl font-black">{aiResult.matchScore}%</span>
                  <span className="text-[10px] uppercase font-bold text-brand-200">Match</span>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold text-white">AI Compatibility Score</h3>
                    {(() => {
                      const badge = getRecommendationBadge(aiResult.recommendation);
                      return (
                        <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${badge.color}`}>
                          {badge.label}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-slate-400">
                    Calculated using Google Gemini AI matching resume against position requirements.
                  </p>
                </div>
              </div>
            </div>

            {/* Overall Assessment */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-brand-400" /> Overall Assessment
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                {aiResult.overallAssessment}
              </p>
            </div>

            {/* Matching vs Missing Skills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Matching Skills */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Matching Skills ({aiResult.matchingSkills.length})
                </h4>
                {aiResult.matchingSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {aiResult.matchingSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                      >
                        ✓ {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No direct skill matches detected in resume text.</p>
                )}
              </div>

              {/* Missing Skills */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <X className="w-4 h-4" /> Missing / Not Found ({aiResult.missingSkills.length})
                </h4>
                {aiResult.missingSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {aiResult.missingSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20"
                      >
                        • {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-emerald-400 italic">All key job skills identified in resume!</p>
                )}
              </div>
            </div>

            {/* Strengths & Concerns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Strengths */}
              {aiResult.strengths.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-brand-400" /> Key Strengths
                  </h4>
                  <ul className="space-y-1.5 pl-4 list-disc text-slate-300">
                    {aiResult.strengths.map((str, idx) => (
                      <li key={idx}>{str}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Concerns */}
              {aiResult.concerns.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-400" /> Potential Areas of Concern
                  </h4>
                  <ul className="space-y-1.5 pl-4 list-disc text-slate-300">
                    {aiResult.concerns.map((con, idx) => (
                      <li key={idx}>{con}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Improvement Suggestions */}
            {aiResult.improvementSuggestions.length > 0 && (
              <div className="p-5 rounded-2xl bg-brand-500/5 border border-brand-500/20 space-y-3">
                <h4 className="text-xs font-bold text-brand-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-brand-400" /> Actionable Resume Recommendations
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {aiResult.improvementSuggestions.map((sug, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-brand-400 font-bold">•</span>
                      <span>{sug}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disclaimer Notice */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
              <strong>AI Disclaimer:</strong> This score is an AI-generated estimate based on the information in your resume and this job listing. It is not a hiring prediction.
            </div>
          </div>
        )}

        {/* Full Job Description Section */}
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <h2 className="text-xl font-bold text-white">Job Description Snippet</h2>
          <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/40 p-6 rounded-2xl border border-slate-800/60">
            {job.description}
          </div>
        </div>

        {/* Adzuna Official Attribution */}
        {attribution && (
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Official Job Data Source</span>
            <a
              href={attribution.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 hover:text-brand-300 font-bold inline-flex items-center gap-1 hover:underline"
            >
              {attribution.text} <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
