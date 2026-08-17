import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Bookmark,
  FileCheck,
  CheckCircle2,
  Award,
  Search,
  User,
  Save,
  Loader2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Upload,
  ExternalLink,
  Check,
  Briefcase,
} from 'lucide-react';
import {
  getDashboardStatsApi,
  getRecommendationsApi,
  saveJobApi,
  DashboardStats,
  JobRecommendation,
} from '../services/api';

export const DashboardPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  // Profile Editor State
  const [name, setName] = useState(user?.name || '');
  const [skillsStr, setSkillsStr] = useState(user?.skills?.join(', ') || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Live Statistics State
  const [stats, setStats] = useState<DashboardStats>({
    savedJobsCount: 0,
    applicationsCount: 0,
    interviewsCount: 0,
    offersCount: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);

  // AI Job Recommendations State
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState<boolean>(true);
  const [recError, setRecError] = useState<string | null>(null);
  const [hasNoResume, setHasNoResume] = useState<boolean>(false);

  // Saved State Tracking for Recommendation Cards
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  const [savingJobId, setSavingJobId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setSkillsStr(user.skills?.join(', ') || '');
    }
  }, [user]);

  // Load Dashboard Stats
  useEffect(() => {
    getDashboardStatsApi()
      .then((res) => {
        if (res.success && res.data) {
          setStats(res.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load dashboard stats:', err);
      })
      .finally(() => setIsLoadingStats(false));
  }, []);

  // Fetch AI Recommendations
  const fetchRecommendations = async (refresh = false) => {
    setIsLoadingRecs(true);
    setRecError(null);
    setHasNoResume(false);

    try {
      const res = await getRecommendationsApi(refresh);
      if (res.success && res.data?.recommendations) {
        setRecommendations(res.data.recommendations);
      } else {
        setRecError(res.message || 'No job recommendations available at this time.');
      }
    } catch (err: any) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.response?.data?.error?.message || '';

      if (status === 400 && (msg.toLowerCase().includes('resume') || msg.toLowerCase().includes('upload'))) {
        setHasNoResume(true);
      } else if (status === 429) {
        setRecError('AI service is temporarily busy. Please wait a moment and try again.');
      } else if (status === 504) {
        setRecError('Recommendation request timed out. Please try again.');
      } else {
        setRecError(msg || 'Failed to load personalized job recommendations.');
      }
    } finally {
      setIsLoadingRecs(false);
    }
  };

  useEffect(() => {
    fetchRecommendations(false);
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const skillsArray = skillsStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await updateProfile({
        name,
        skills: skillsArray,
      });

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error?.message || 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRecommendation = async (rec: JobRecommendation) => {
    try {
      setSavingJobId(rec.jobId);
      await saveJobApi(rec.jobId, {
        title: rec.job.title,
        companyName: rec.job.company.name,
        location: rec.job.location.displayName,
        jobUrl: rec.job.url,
      });
      setSavedMap((prev) => ({ ...prev, [rec.jobId]: true }));
      setStats((prev) => ({ ...prev, savedJobsCount: prev.savedJobsCount + 1 }));
    } catch (err: any) {
      if (err.response?.status === 409) {
        setSavedMap((prev) => ({ ...prev, [rec.jobId]: true }));
      }
    } finally {
      setSavingJobId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Welcome Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20 mb-3 inline-block">
              Candidate Workspace
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="text-brand-400">{user?.name}</span> 👋
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage your saved jobs, application status pipeline, and AI-matched recommendations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/jobs"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-500 hover:to-accent-500 text-white font-semibold text-xs shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2"
            >
              <Search className="w-4 h-4" /> Browse Jobs
            </Link>

            <Link
              to="/saved-jobs"
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white font-semibold text-xs transition-colors flex items-center gap-2"
            >
              <Bookmark className="w-4 h-4 text-brand-400" /> Saved Jobs
            </Link>
          </div>
        </div>
      </div>

      {/* Summary Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Saved Jobs Card */}
        <Link
          to="/saved-jobs"
          className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-brand-500/40 transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saved Jobs</span>
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 group-hover:scale-110 transition-transform">
              <Bookmark className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">
            {isLoadingStats ? <Loader2 className="w-6 h-6 animate-spin text-slate-600" /> : stats.savedJobsCount}
          </div>
          <span className="text-xs text-brand-400 font-semibold mt-2 inline-flex items-center gap-1 group-hover:underline">
            View saved positions <ArrowRight className="w-3 h-3" />
          </span>
        </Link>

        {/* Applications Card */}
        <Link
          to="/applications"
          className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-brand-500/40 transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Applications</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">
            {isLoadingStats ? <Loader2 className="w-6 h-6 animate-spin text-slate-600" /> : stats.applicationsCount}
          </div>
          <span className="text-xs text-blue-400 font-semibold mt-2 inline-flex items-center gap-1 group-hover:underline">
            Track applications <ArrowRight className="w-3 h-3" />
          </span>
        </Link>

        {/* Interviews Card */}
        <Link
          to="/applications?status=interview"
          className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-brand-500/40 transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Interviews</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">
            {isLoadingStats ? <Loader2 className="w-6 h-6 animate-spin text-slate-600" /> : stats.interviewsCount}
          </div>
          <span className="text-xs text-purple-400 font-semibold mt-2 inline-flex items-center gap-1 group-hover:underline">
            View scheduled interviews <ArrowRight className="w-3 h-3" />
          </span>
        </Link>

        {/* Offers Card */}
        <Link
          to="/applications?status=offer"
          className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-brand-500/40 transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Offers</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">
            {isLoadingStats ? <Loader2 className="w-6 h-6 animate-spin text-slate-600" /> : stats.offersCount}
          </div>
          <span className="text-xs text-emerald-400 font-semibold mt-2 inline-flex items-center gap-1 group-hover:underline">
            View offer letters <ArrowRight className="w-3 h-3" />
          </span>
        </Link>
      </div>

      {/* ── RECOMMENDED JOBS FOR YOU SECTION ── */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Recommended Jobs For You</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Personalized position recommendations powered by Google Gemini AI based on your resume, skills, and preferences.
            </p>
          </div>

          {!hasNoResume && (
            <button
              onClick={() => fetchRecommendations(true)}
              disabled={isLoadingRecs}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-brand-500/40 text-slate-300 hover:text-white font-semibold text-xs transition-colors flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRecs ? 'animate-spin text-brand-400' : ''}`} />
              Refresh Recommendations
            </button>
          )}
        </div>

        {/* Loading Skeleton State */}
        {isLoadingRecs && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-brand-500/5 border border-brand-500/10 text-brand-300 text-xs font-semibold">
              <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
              Finding jobs that match your profile...
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 animate-pulse">
                  <div className="h-5 bg-slate-800 rounded w-2/3" />
                  <div className="h-4 bg-slate-800/60 rounded w-1/3" />
                  <div className="h-16 bg-slate-800/40 rounded w-full" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missing Resume Banner */}
        {!isLoadingRecs && hasNoResume && (
          <div className="p-8 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-200">Upload your resume to get personalized job recommendations.</h3>
              <p className="text-xs text-amber-300/70 mt-1 max-w-md mx-auto">
                Our Gemini AI engine parses your technical skills, work experience, and education to rank job opportunities tailored specifically to your background.
              </p>
            </div>
            <Link
              to="/resume"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-colors"
            >
              <Upload className="w-4 h-4" /> Upload Resume
            </Link>
          </div>
        )}

        {/* Error State */}
        {!isLoadingRecs && recError && !hasNoResume && (
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-300">{recError}</p>
            <button
              onClick={() => fetchRecommendations(true)}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Recommendations Grid */}
        {!isLoadingRecs && !hasNoResume && !recError && recommendations.length > 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {recommendations.map((rec) => {
                const isSaved = savedMap[rec.jobId];
                const isSavingThis = savingJobId === rec.jobId;

                return (
                  <div
                    key={rec.jobId}
                    className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-brand-500/40 transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors line-clamp-1">
                            {rec.job.title}
                          </h3>
                          <p className="text-xs text-slate-400 font-medium">{rec.job.company.name}</p>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black tracking-wider border shrink-0 ${
                            rec.matchScore >= 80
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : rec.matchScore >= 60
                              ? 'bg-brand-500/10 text-brand-300 border-brand-500/30'
                              : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                          }`}
                        >
                          {rec.matchScore}% Match
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 flex items-center gap-2">
                        <span>📍 {rec.job.location.displayName}</span>
                        {rec.job.category && <span className="text-slate-600">• {rec.job.category}</span>}
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 italic">
                        "{rec.recommendationReason}"
                      </p>

                      {/* Matching Skills */}
                      {rec.matchingSkills.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Matching Skills
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {rec.matchingSkills.slice(0, 5).map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1"
                              >
                                <Check className="w-3 h-3 text-emerald-400" /> {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Missing Skills */}
                      {rec.missingSkills.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Not Found in Resume
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {rec.missingSkills.slice(0, 4).map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700"
                              >
                                • {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 gap-3">
                      <Link
                        to={`/jobs/${rec.job.id}`}
                        className="flex-1 py-2 rounded-xl bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/30 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Briefcase className="w-3.5 h-3.5" /> View Job
                      </Link>

                      <button
                        onClick={() => handleSaveRecommendation(rec)}
                        disabled={isSaved || isSavingThis}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                          isSaved
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        {isSavingThis ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isSaved ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Bookmark className="w-3.5 h-3.5" />
                        )}
                        {isSaved ? 'Saved' : 'Save Job'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Official Adzuna Attribution Link */}
            <div className="pt-2 text-right">
              <a
                href="https://www.adzuna.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-400 inline-flex items-center gap-1 transition-colors"
              >
                Jobs by Adzuna <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Empty state when recommendations list is empty */}
        {!isLoadingRecs && !hasNoResume && !recError && recommendations.length === 0 && (
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
            <p className="text-xs text-slate-400">No suitable job recommendations were found right now.</p>
            <button
              onClick={() => fetchRecommendations(true)}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors inline-flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Recommendations
            </button>
          </div>
        )}
      </div>

      {/* Profile Details Editor */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-8">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-brand-400" /> Candidate Profile Details
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Keep your skills, education, and work experience updated for AI resume matching and personalized recommendations.
          </p>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold ${
              message.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Technical Skills (Comma separated)
              </label>
              <input
                type="text"
                value={skillsStr}
                onChange={(e) => setSkillsStr(e.target.value)}
                placeholder="React, TypeScript, Node.js, MongoDB, Python"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Profile
          </button>
        </form>
      </div>
    </div>
  );
};
