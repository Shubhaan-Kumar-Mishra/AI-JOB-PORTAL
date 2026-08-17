import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck,
  Building2,
  MapPin,
  Calendar,
  ExternalLink,
  ArrowRight,
  Loader2,
  AlertCircle,
  Briefcase,
  Plus,
  Edit3,
  Sparkles,
  CheckCircle2,
  Clock,
  UserCheck,
  Award,
  XCircle,
} from 'lucide-react';
import {
  getApplicationsApi,
  updateApplicationApi,
  ApplicationItem,
  ApplicationStatus,
} from '../services/api';

export const ApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchApplications = async (statusFilter?: string) => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const filter = statusFilter && statusFilter !== 'all' ? (statusFilter as ApplicationStatus) : undefined;
      const res = await getApplicationsApi(1, 50, filter);
      if (res.success && res.data) {
        setApplications(res.data.applications);
      } else {
        setErrorMsg('Failed to load applications.');
      }
    } catch (err: any) {
      console.error('Fetch applications error:', err);
      setErrorMsg('Unable to retrieve your applications. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications(activeTab);
  }, [activeTab]);

  const handleStatusChange = async (id: string, newStatus: ApplicationStatus) => {
    try {
      setUpdatingId(id);
      const res = await updateApplicationApi(id, { status: newStatus });
      if (res.success && res.data?.application) {
        setApplications((prev) =>
          prev.map((app) => (app._id === id ? { ...app, status: res.data.application.status } : app))
        );
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update application status');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'applied':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-3.5 h-3.5" /> Applied
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <UserCheck className="w-3.5 h-3.5" /> Under Review
          </span>
        );
      case 'interview':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse">
            <CheckCircle2 className="w-3.5 h-3.5" /> Interview Scheduled
          </span>
        );
      case 'offer':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Award className="w-3.5 h-3.5" /> Offer Received! 🎉
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> Not Selected
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (e) {
      return 'Recently applied';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20 mb-2">
            <FileCheck className="w-3.5 h-3.5 text-brand-400" /> Candidate Application Pipeline
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Track Your Applications</h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor response statuses, interview dates, and personal notes for all applied roles.
          </p>
        </div>

        <Link
          to="/jobs"
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-500 hover:to-accent-500 text-white font-semibold text-xs shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Find Jobs to Apply
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-8 overflow-x-auto">
        {[
          { id: 'all', label: 'All Applications' },
          { id: 'applied', label: 'Applied' },
          { id: 'under_review', label: 'Under Review' },
          { id: 'interview', label: 'Interview' },
          { id: 'offer', label: 'Offer' },
          { id: 'rejected', label: 'Rejected' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="mb-8 p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-300 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-rose-200 mb-1">Error Loading Applications</h4>
            <p>{errorMsg}</p>
            <button
              onClick={() => fetchApplications(activeTab)}
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
      {!isLoading && !errorMsg && applications.length === 0 && (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center max-w-md mx-auto my-12">
          <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No applications found</h3>
          <p className="text-xs text-slate-400 mb-6">
            {activeTab === 'all'
              ? 'You haven\'t tracked any job applications yet. Click "Apply on Company Site" on any job position to start tracking your progress!'
              : `No applications found with status "${activeTab}".`}
          </p>
          <Link
            to="/jobs"
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Explore Available Jobs
          </Link>
        </div>
      )}

      {/* Applications Cards List */}
      {!isLoading && !errorMsg && applications.length > 0 && (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app._id}
              className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-brand-500/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group"
            >
              <div className="space-y-2 flex-grow">
                <div className="flex flex-wrap items-center gap-3">
                  {getStatusBadge(app.status)}
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Applied {formatDate(app.appliedAt)}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white group-hover:text-brand-300 transition-colors">
                  <Link to={`/applications/${app._id}`}>{app.jobTitle}</Link>
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 font-medium">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-brand-400" /> {app.companyName}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" /> {app.location}
                  </span>
                </div>

                {app.notes && (
                  <p className="text-xs text-slate-400 line-clamp-1 italic bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800/60 max-w-xl">
                    "{app.notes}"
                  </p>
                )}
              </div>

              {/* Status Selector & Actions */}
              <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end">
                {/* Status Dropdown */}
                <div className="relative">
                  <select
                    disabled={updatingId === app._id}
                    value={app.status}
                    onChange={(e) => handleStatusChange(app._id, e.target.value as ApplicationStatus)}
                    className="bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500 cursor-pointer disabled:opacity-50"
                  >
                    <option value="applied">Applied</option>
                    <option value="under_review">Under Review</option>
                    <option value="interview">Interview</option>
                    <option value="offer">Offer</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <Link
                  to={`/applications/${app._id}`}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors inline-flex items-center gap-1.5"
                >
                  Manage <Edit3 className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
