import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  ExternalLink,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  Clock,
  UserCheck,
  Award,
  XCircle,
  FileText,
} from 'lucide-react';
import {
  getApplicationByIdApi,
  updateApplicationApi,
  deleteApplicationApi,
  ApplicationItem,
  ApplicationStatus,
} from '../services/api';

export const ApplicationDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [application, setApplication] = useState<ApplicationItem | null>(null);
  const [status, setStatus] = useState<ApplicationStatus>('applied');
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      getApplicationByIdApi(id)
        .then((res) => {
          if (res.success && res.data?.application) {
            setApplication(res.data.application);
            setStatus(res.data.application.status);
            setNotes(res.data.application.notes || '');
          } else {
            setErrorMsg('Application details could not be found.');
          }
        })
        .catch((err) => {
          console.error('Fetch application detail error:', err);
          setErrorMsg(err.response?.data?.error?.message || 'Access denied or record not found.');
        })
        .finally(() => setIsLoading(false));
    }
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setIsSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      const res = await updateApplicationApi(id, { status, notes });
      if (res.success && res.data?.application) {
        setApplication(res.data.application);
        setSuccessMsg('Application updated successfully!');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to update application.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !application) return;
    if (!window.confirm(`Are you sure you want to delete your application record for "${application.jobTitle}"?`)) {
      return;
    }
    try {
      setIsDeleting(true);
      await deleteApplicationApi(id);
      navigate('/applications');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to delete application.');
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (e) {
      return 'Recently applied';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          <span className="text-sm font-medium text-slate-400">Loading application details...</span>
        </div>
      </div>
    );
  }

  if (errorMsg || !application) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="glass-panel p-8 rounded-2xl border border-slate-800">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Application Record Unavailable</h2>
          <p className="text-xs text-slate-400 mb-6">{errorMsg || 'Application details could not be retrieved.'}</p>
          <Link
            to="/applications"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs rounded-xl inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Applications List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back Link */}
      <Link
        to="/applications"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to All Applications
      </Link>

      {/* Main Container */}
      <div className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-8">
        {/* Header Summary */}
        <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20">
              <FileCheck className="w-3.5 h-3.5 text-brand-400" /> Tracked Application
            </div>

            <h1 className="text-3xl font-black text-white tracking-tight leading-tight">{application.jobTitle}</h1>

            <div className="flex flex-wrap items-center gap-5 text-sm text-slate-300 font-medium pt-1">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-brand-400" /> {application.companyName}
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <MapPin className="w-4 h-4 text-emerald-400" /> {application.location}
              </span>
              <span className="flex items-center gap-1.5 text-slate-400 text-xs">
                <Calendar className="w-3.5 h-3.5" /> Applied on {formatDate(application.appliedAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={application.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors inline-flex items-center gap-2"
            >
              View Listing <ExternalLink className="w-4 h-4" />
            </a>

            <button
              disabled={isDeleting}
              onClick={handleDelete}
              title="Delete this application record"
              className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Success / Error Banners */}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
            {successMsg}
          </div>
        )}

        {/* Update Form */}
        <form onSubmit={handleUpdate} className="space-y-6">
          {/* Status Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Application Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
              className="w-full md:w-72 bg-slate-900 border border-slate-800 text-slate-200 text-sm font-semibold rounded-xl p-3 focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              <option value="applied">Applied</option>
              <option value="under_review">Under Review</option>
              <option value="interview">Interview Scheduled</option>
              <option value="offer">Offer Received</option>
              <option value="rejected">Rejected / Not Selected</option>
            </select>
          </div>

          {/* Personal Notes Editor */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-brand-400" /> Personal Notes & Interview Logs
            </label>
            <textarea
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record recruiter contact info, interview dates, follow-up notes, or salary discussions..."
              className="w-full bg-slate-900/90 border border-slate-800 text-slate-200 text-sm rounded-xl p-4 placeholder-slate-500 focus:outline-none focus:border-brand-500 leading-relaxed"
            />
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-500 hover:to-accent-500 text-white font-bold text-xs shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Application Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
