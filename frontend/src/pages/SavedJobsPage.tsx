import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bookmark,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  Trash2,
  ExternalLink,
  ArrowRight,
  Loader2,
  AlertCircle,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { getSavedJobsApi, removeSavedJobApi, SavedJobItem } from '../services/api';

export const SavedJobsPage: React.FC = () => {
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState<SavedJobItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [removingJobId, setRemovingJobId] = useState<string | null>(null);

  const fetchSavedJobs = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await getSavedJobsApi(1, 50);
      if (res.success && res.data) {
        setSavedJobs(res.data.savedJobs);
      } else {
        setErrorMsg('Failed to load saved jobs.');
      }
    } catch (err: any) {
      console.error('Fetch saved jobs error:', err);
      setErrorMsg('Unable to retrieve your saved jobs. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const handleRemoveSavedJob = async (jobId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to remove "${title}" from your saved jobs?`)) {
      return;
    }
    try {
      setRemovingJobId(jobId);
      await removeSavedJobApi(jobId);
      setSavedJobs((prev) => prev.filter((j) => j.jobId !== jobId));
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to remove saved job');
    } finally {
      setRemovingJobId(null);
    }
  };

  const formatSalary = (min?: number | null, max?: number | null) => {
    if (!min && !max) return 'Salary Undisclosed';
    if (min && max) return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
    if (min) return `From ₹${min.toLocaleString()}`;
    if (max) return `Up to ₹${max.toLocaleString()}`;
    return 'Competitive Salary';
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (e) {
      return 'Recently saved';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20 mb-2">
            <Bookmark className="w-3.5 h-3.5 text-brand-400" /> Saved Positions Collection
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Your Saved Jobs</h1>
          <p className="text-sm text-slate-400 mt-1">
            Bookmarked career opportunities saved for review and application.
          </p>
        </div>

        <Link
          to="/jobs"
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 self-start md:self-auto"
        >
          <Briefcase className="w-4 h-4" /> Browse More Jobs
        </Link>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="mb-8 p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-300 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-rose-200 mb-1">Error Loading Saved Jobs</h4>
            <p>{errorMsg}</p>
            <button
              onClick={fetchSavedJobs}
              className="mt-3 px-3 py-1 rounded-lg bg-rose-500/20 text-rose-200 font-semibold border border-rose-500/30"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-panel p-6 rounded-2xl border border-slate-800 animate-pulse space-y-3">
              <div className="h-5 bg-slate-800/80 rounded w-1/3" />
              <div className="h-4 bg-slate-800/60 rounded w-1/4" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !errorMsg && savedJobs.length === 0 && (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center max-w-md mx-auto my-12">
          <Bookmark className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">You haven't saved any jobs yet.</h3>
          <p className="text-xs text-slate-400 mb-6">
            Explore live job opportunities and click the "Save Job" button to bookmark positions here.
          </p>
          <Link
            to="/jobs"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-500 hover:to-accent-500 text-white font-semibold text-xs shadow-lg shadow-brand-500/20 inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Browse Jobs Now
          </Link>
        </div>
      )}

      {/* Saved Jobs List */}
      {!isLoading && !errorMsg && savedJobs.length > 0 && (
        <div className="space-y-4">
          {savedJobs.map((item) => (
            <div
              key={item._id}
              className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-brand-500/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group"
            >
              <div className="space-y-2 flex-grow">
                <h3 className="text-xl font-bold text-white group-hover:text-brand-300 transition-colors">
                  <Link to={`/jobs/${item.jobId}`}>{item.title}</Link>
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 font-medium">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-brand-400" /> {item.companyName}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" /> {item.location}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <DollarSign className="w-3.5 h-3.5" /> {formatSalary(item.salary?.min, item.salary?.max)}
                  </span>
                  <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                    <Calendar className="w-3.5 h-3.5" /> Saved {formatDate(item.savedAt)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end">
                <Link
                  to={`/jobs/${item.jobId}`}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors inline-flex items-center gap-1.5"
                >
                  View Details <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <a
                  href={item.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md transition-colors inline-flex items-center gap-1.5"
                >
                  Apply <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  disabled={removingJobId === item.jobId}
                  onClick={() => handleRemoveSavedJob(item.jobId, item.title)}
                  title="Remove from saved jobs"
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors disabled:opacity-50"
                >
                  {removingJobId === item.jobId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
