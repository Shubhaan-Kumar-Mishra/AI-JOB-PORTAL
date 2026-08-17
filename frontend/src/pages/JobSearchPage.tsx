import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Briefcase,
  DollarSign,
  ArrowRight,
  Bookmark,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Building2,
  Calendar,
  Sparkles,
  Check,
} from 'lucide-react';
import { searchJobsApi, saveJobApi, removeSavedJobApi, checkJobSavedApi, StandardJob } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const JobSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter State
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || 'Developer');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'salary'>((searchParams.get('sortBy') as any) || 'relevance');
  const [fullTime, setFullTime] = useState(searchParams.get('fullTime') === 'true');
  const [permanent, setPermanent] = useState(searchParams.get('permanent') === 'true');
  const [salaryMin, setSalaryMin] = useState(searchParams.get('salaryMin') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  // Response Data State
  const [jobs, setJobs] = useState<StandardJob[]>([]);
  const [pagination, setPagination] = useState({ page: 1, resultsPerPage: 20, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Saved Jobs Tracking State (Map of jobId -> boolean)
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  const [savingJobId, setSavingJobId] = useState<string | null>(null);

  const fetchJobs = async (targetPage = page, targetSort = sortBy) => {
    try {
      setIsLoading(true);
      setErrorMsg(null);

      const res = await searchJobsApi({
        keyword,
        location,
        page: targetPage,
        resultsPerPage: 15,
        sortBy: targetSort,
        salaryMin: salaryMin ? parseInt(salaryMin, 10) : undefined,
        fullTime,
        permanent,
      });

      if (res.success && res.data) {
        setJobs(res.data.jobs);
        setPagination(res.data.pagination);
      } else {
        setErrorMsg(res.error?.message || 'Failed to fetch job listings from Adzuna.');
      }
    } catch (err: any) {
      console.error('Job search API error:', err);
      setErrorMsg(
        err.response?.data?.error?.message ||
          'Failed to load jobs. Please check if your backend server is running and ADZUNA environment variables are set.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs(page, sortBy);
  }, [page, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchParams({
      keyword,
      location,
      sortBy,
      fullTime: fullTime ? 'true' : 'false',
      permanent: permanent ? 'true' : 'false',
      page: '1',
    });
    fetchJobs(1, sortBy);
  };

  const handleToggleSaveJob = async (job: StandardJob) => {
    if (!isAuthenticated) {
      if (window.confirm('You must be signed in to save jobs. Would you like to sign in now?')) {
        navigate('/login');
      }
      return;
    }

    const isCurrentlySaved = !!savedMap[job.id];
    try {
      setSavingJobId(job.id);
      if (isCurrentlySaved) {
        await removeSavedJobApi(job.id);
        setSavedMap((prev) => ({ ...prev, [job.id]: false }));
      } else {
        await saveJobApi(job.id, {
          title: job.title,
          companyName: job.company.name,
          location: job.location.displayName,
          jobUrl: job.url,
          salary: job.salary,
        });
        setSavedMap((prev) => ({ ...prev, [job.id]: true }));
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update saved job status');
    } finally {
      setSavingJobId(null);
    }
  };

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Salary Undisclosed';
    if (min && max) return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
    if (min) return `From ₹${min.toLocaleString()}`;
    if (max) return `Up to ₹${max.toLocaleString()}`;
    return 'Competitive Salary';
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return 'Recently posted';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Search Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Real-Time Job Database • India Market (Adzuna API)</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Explore Live Career Opportunities</h1>
        <p className="text-sm text-slate-400 mt-1">
          Search thousands of active software engineering, tech, and corporate positions across India.
        </p>
      </div>

      {/* Filter Bar Form */}
      <form onSubmit={handleSearchSubmit} className="glass-panel p-5 rounded-2xl border border-slate-800 mb-8 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Keyword Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Job title, skills, or technology (e.g. React, Developer)"
              className="w-full pl-11 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm"
            />
          </div>

          {/* Location Input */}
          <div className="md:col-span-4 relative">
            <MapPin className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City or region (e.g. Delhi, Bengaluru, Mumbai)"
              className="w-full pl-11 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm"
            />
          </div>

          {/* Search Action Button */}
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-500 hover:to-accent-500 text-white font-semibold text-sm shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" /> Find Jobs
                </>
              )}
            </button>
          </div>
        </div>

        {/* Secondary Filter Options */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={fullTime}
                onChange={(e) => setFullTime(e.target.checked)}
                className="rounded bg-slate-900 border-slate-800 text-brand-500 focus:ring-0"
              />
              Full-Time Only
            </label>

            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={permanent}
                onChange={(e) => setPermanent(e.target.checked)}
                className="rounded bg-slate-900 border-slate-800 text-brand-500 focus:ring-0"
              />
              Permanent Positions
            </label>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                const newSort = e.target.value as any;
                setSortBy(newSort);
                setPage(1);
              }}
              className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-500 text-xs"
            >
              <option value="relevance">Relevance</option>
              <option value="date">Most Recent</option>
              <option value="salary">Highest Salary</option>
            </select>
          </div>
        </div>
      </form>

      {/* Error Alert State */}
      {errorMsg && (
        <div className="mb-8 p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-300 text-xs leading-relaxed">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-rose-200 mb-1">Job Search Error</h4>
            <p>{errorMsg}</p>
            <button
              onClick={() => fetchJobs(page, sortBy)}
              className="mt-3 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold border border-rose-500/30 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-panel p-6 rounded-2xl border border-slate-800 animate-pulse space-y-3">
              <div className="h-5 bg-slate-800/80 rounded w-1/3" />
              <div className="h-4 bg-slate-800/60 rounded w-1/4" />
              <div className="h-12 bg-slate-800/40 rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !errorMsg && jobs.length === 0 && (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center max-w-lg mx-auto">
          <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Jobs Found</h3>
          <p className="text-xs text-slate-400 mb-6">
            We couldn't find any positions matching "{keyword}" {location ? `in ${location}` : ''}. Try broadening your search or clearing location filters.
          </p>
          <button
            onClick={() => {
              setKeyword('');
              setLocation('');
              setPage(1);
              fetchJobs(1, sortBy);
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
          >
            Clear Filters & Search All
          </button>
        </div>
      )}

      {/* Job Listings Grid */}
      {!isLoading && !errorMsg && jobs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Showing {jobs.length} jobs (Total: {pagination.total.toLocaleString()})</span>
            <span>Page {pagination.page} of {pagination.totalPages}</span>
          </div>

          {jobs.map((job) => {
            const isSaved = !!savedMap[job.id];
            const isSavingThis = savingJobId === job.id;

            return (
              <div
                key={job.id}
                className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-brand-500/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group"
              >
                <div className="space-y-2.5 flex-grow">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-brand-500/10 text-brand-300 border border-brand-500/20">
                      {job.category}
                    </span>
                    {job.contractTime && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 uppercase">
                        {job.contractTime === 'full_time' ? 'Full Time' : job.contractTime}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {formatDate(job.created)}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-brand-300 transition-colors">
                    <Link to={`/jobs/${job.id}`} state={{ job }}>
                      {job.title}
                    </Link>
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Building2 className="w-3.5 h-3.5 text-brand-400" /> {job.company.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" /> {job.location.displayName}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <DollarSign className="w-3.5 h-3.5" /> {formatSalary(job.salary.min, job.salary.max)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex md:flex-col items-center gap-2.5 shrink-0 w-full md:w-auto justify-end">
                  <Link
                    to={`/jobs/${job.id}`}
                    state={{ job }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
                  >
                    View Details <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    disabled={isSavingThis}
                    onClick={() => handleToggleSaveJob(job)}
                    className={`w-full sm:w-auto px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      isSaved
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-brand-500/40 hover:text-white'
                    }`}
                  >
                    {isSavingThis ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Saved
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-3.5 h-3.5 text-slate-400" /> Save Job
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="pt-8 flex items-center justify-between border-t border-slate-800/80">
              <button
                disabled={page <= 1}
                onClick={() => {
                  const newPage = page - 1;
                  setPage(newPage);
                  setSearchParams({ keyword, location, page: String(newPage) });
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-semibold text-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <span className="text-xs text-slate-400 font-medium">
                Page {page} of {pagination.totalPages}
              </span>

              <button
                disabled={page >= pagination.totalPages}
                onClick={() => {
                  const newPage = page + 1;
                  setPage(newPage);
                  setSearchParams({ keyword, location, page: String(newPage) });
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-semibold text-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Official Adzuna Required Attribution */}
      <div className="mt-12 pt-6 border-t border-slate-900 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
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
  );
};
