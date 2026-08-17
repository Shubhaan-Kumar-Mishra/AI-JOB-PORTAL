import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  Briefcase,
  ExternalLink,
  Bookmark,
  Sparkles,
  Loader2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { getJobDetailsApi, StandardJob } from '../services/api';

export const JobDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  // Use passed location state if available, or fetch details from API
  const initialJob: StandardJob | null = location.state?.job || null;
  const [job, setJob] = useState<StandardJob | null>(initialJob);
  const [isLoading, setIsLoading] = useState<boolean>(!initialJob);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!job && id) {
      setIsLoading(true);
      getJobDetailsApi(id)
        .then((res) => {
          if (res.success && res.data?.job) {
            setJob(res.data.job);
          } else {
            setErrorMsg('Job details could not be found.');
          }
        })
        .catch((err) => {
          console.error('Job details error:', err);
          setErrorMsg('Failed to load job details. Please try again.');
        })
        .finally(() => setIsLoading(false));
    }
  }, [id, job]);

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Salary Undisclosed';
    if (min && max) return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
    if (min) return `From ₹${min.toLocaleString()}`;
    if (max) return `Up to ₹${max.toLocaleString()}`;
    return 'Competitive Salary';
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (e) {
      return 'Recently posted';
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
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="glass-panel p-8 rounded-2xl border border-slate-800">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Job Listing Unavailable</h2>
          <p className="text-xs text-slate-400 mb-6">{errorMsg || 'The requested job position could not be retrieved.'}</p>
          <Link
            to="/jobs"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs rounded-xl inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Job Search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back Navigation Link */}
      <Link
        to="/jobs"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Job Search
      </Link>

      {/* Main Job Detail Panel */}
      <div className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-8">
        {/* Header Summary */}
        <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-md text-xs font-bold bg-brand-500/10 text-brand-300 border border-brand-500/20">
                {job.category}
              </span>
              {job.contractTime && (
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 text-slate-300 uppercase">
                  {job.contractTime === 'full_time' ? 'Full Time' : job.contractTime}
                </span>
              )}
            </div>

            <h1 className="text-3xl font-black text-white tracking-tight leading-tight">{job.title}</h1>

            <div className="flex flex-wrap items-center gap-5 text-sm text-slate-300 font-medium pt-1">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-brand-400" /> {job.company.name}
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <MapPin className="w-4 h-4 text-emerald-400" /> {job.location.displayName}
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <DollarSign className="w-4 h-4" /> {formatSalary(job.salary.min, job.salary.max)}
              </span>
              <span className="flex items-center gap-1.5 text-slate-500 text-xs">
                <Calendar className="w-3.5 h-3.5" /> Posted {formatDate(job.created)}
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row md:flex-col items-stretch gap-3 shrink-0">
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-500 hover:to-accent-500 text-white font-bold text-sm shadow-xl shadow-brand-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              Apply on Company Site <ExternalLink className="w-4 h-4" />
            </a>

            <button
              disabled
              title="Save Job functionality will be enabled in Stage 4"
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 font-semibold text-xs flex items-center justify-center gap-2 opacity-60 cursor-not-allowed"
            >
              <Bookmark className="w-4 h-4" /> Save Job Position
            </button>
          </div>
        </div>

        {/* Job Description Snippet Section */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-400" /> Job Description Snippet
          </h3>
          <p className="text-xs text-slate-400 italic">
            Note: Adzuna provides a publisher summary snippet below. Click "Apply on Company Site" to view full listing details and application instructions.
          </p>
          <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/50 p-6 rounded-xl border border-slate-800/80">
            {job.description}
          </div>
        </div>

        {/* Redirect Notice */}
        <div className="p-5 rounded-xl bg-brand-500/10 border border-brand-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-brand-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-400" /> External Application Link
            </h4>
            <p className="text-xs text-slate-400">
              Clicking apply will open the original job application page on the employer/publisher site via Adzuna.
            </p>
          </div>
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs whitespace-nowrap shadow-md transition-colors flex items-center gap-1.5"
          >
            Apply Now <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Official Adzuna Required Attribution Banner */}
        <div className="pt-6 border-t border-slate-900 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <span>Jobs by</span>
          <a
            href="https://www.adzuna.in"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-brand-400 hover:underline inline-flex items-center gap-1"
          >
            Adzuna <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
