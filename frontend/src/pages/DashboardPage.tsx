import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Bookmark,
  FileCheck,
  CheckCircle2,
  Award,
  Search,
  User,
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
  Briefcase,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { getDashboardStatsApi, DashboardStats } from '../services/api';

export const DashboardPage: React.FC = () => {
  const { user, updateProfile } = useAuth();

  // Profile Editor State
  const [name, setName] = useState(user?.name || '');
  const [skillsStr, setSkillsStr] = useState(user?.skills?.join(', ') || '');
  const [degree, setDegree] = useState('');
  const [institution, setInstitution] = useState('');
  const [expTitle, setExpTitle] = useState('');
  const [expCompany, setExpCompany] = useState('');

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

  useEffect(() => {
    if (user) {
      setName(user.name);
      setSkillsStr(user.skills?.join(', ') || '');
    }
  }, [user]);

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

  const handleAddEducation = async () => {
    if (!degree || !institution) return;
    try {
      setIsSaving(true);
      const newEdu = [...(user?.education || []), { degree, institution }];
      await updateProfile({ education: newEdu });
      setDegree('');
      setInstitution('');
      setMessage({ type: 'success', text: 'Education entry added!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to add education entry' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddExperience = async () => {
    if (!expTitle || !expCompany) return;
    try {
      setIsSaving(true);
      const newExp = [...(user?.experience || []), { title: expTitle, company: expCompany }];
      await updateProfile({ experience: newExp });
      setExpTitle('');
      setExpCompany('');
      setMessage({ type: 'success', text: 'Work experience entry added!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to add experience entry' });
    } finally {
      setIsSaving(false);
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
              Manage your saved jobs, application status pipeline, and professional profile details.
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

      {/* Profile Details Editor */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-8">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-brand-400" /> Candidate Profile Details
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Keep your skills, education, and work experience updated for AI resume matching in Stage 5.
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
