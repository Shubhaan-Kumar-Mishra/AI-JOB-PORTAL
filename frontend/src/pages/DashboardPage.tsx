import React, { useState } from 'react';
import { Search, Upload, Bookmark, Send, Sparkles, FileText, CheckCircle2, TrendingUp, Filter } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'matches' | 'saved' | 'applications' | 'resume'>('matches');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Candidate Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Welcome back! Here is your AI job matching activity and profile summary.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('resume')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-500 hover:to-accent-500 text-white font-semibold text-xs shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Upload Resume for AI Analysis
          </button>
        </div>
      </div>

      {/* Stats Metric Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Saved Jobs</span>
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <Bookmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">12</div>
          <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" /> +3 this week
          </span>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Applications Sent</span>
            <div className="w-8 h-8 rounded-lg bg-accent-500/10 text-accent-400 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">5</div>
          <span className="text-xs text-slate-400 font-medium mt-1">2 under review</span>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Resume Score</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">88%</div>
          <span className="text-xs text-emerald-400 font-medium mt-1">Top 10% match</span>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resume File</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-sm font-bold text-white truncate">resume_fullstack_2026.pdf</div>
          <span className="text-xs text-slate-400 font-medium mt-1">Parsed & Ready</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-800 mb-6 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('matches')}
          className={`px-4 py-2.5 rounded-t-xl text-sm font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'matches'
              ? 'border-brand-500 text-white bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-brand-400" /> AI Job Matches
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`px-4 py-2.5 rounded-t-xl text-sm font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'saved'
              ? 'border-brand-500 text-white bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bookmark className="w-4 h-4 text-accent-400" /> Saved Jobs (12)
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2.5 rounded-t-xl text-sm font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'applications'
              ? 'border-brand-500 text-white bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Send className="w-4 h-4 text-emerald-400" /> Application Tracker (5)
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'matches' && (
        <div className="space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  ADZUNA LIVE
                </span>
                <span className="text-xs text-slate-400">Posted 2 hours ago</span>
              </div>
              <h3 className="text-lg font-bold text-white">Full-Stack Cloud Developer</h3>
              <p className="text-xs text-slate-400">TechCorp Solutions • Remote / New York • $135,000 - $160,000</p>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              <div className="text-right">
                <div className="text-lg font-bold text-emerald-400">92% Match</div>
                <div className="text-[10px] text-slate-400">Gemini Compatibility</div>
              </div>
              <button className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md transition-colors">
                Apply Now
              </button>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  ADZUNA LIVE
                </span>
                <span className="text-xs text-slate-400">Posted 1 day ago</span>
              </div>
              <h3 className="text-lg font-bold text-white">Senior React / TypeScript Engineer</h3>
              <p className="text-xs text-slate-400">ScaleUp Inc • Remote • $140,000 - $175,000</p>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              <div className="text-right">
                <div className="text-lg font-bold text-emerald-400">89% Match</div>
                <div className="text-[10px] text-slate-400">Gemini Compatibility</div>
              </div>
              <button className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md transition-colors">
                Apply Now
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center">
          <Bookmark className="w-8 h-8 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Saved Jobs Collection</h3>
          <p className="text-xs text-slate-400 mt-1">Saved jobs and Adzuna API sync will be enabled in subsequent stages.</p>
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center">
          <Send className="w-8 h-8 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Application Tracker</h3>
          <p className="text-xs text-slate-400 mt-1">MongoDB application status tracking (Applied, Interviewing, Offered) ready for Stage 2.</p>
        </div>
      )}

      {activeTab === 'resume' && (
        <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center max-w-xl mx-auto">
          <Upload className="w-10 h-10 text-brand-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white">Upload Your Resume</h3>
          <p className="text-xs text-slate-400 mt-1 mb-6">PDF or DOCX format. Gemini AI will automatically extract your skills, experience, and generate compatibility scores.</p>
          <div className="border-2 border-dashed border-slate-700 hover:border-brand-500/60 rounded-xl p-6 bg-slate-900/50 cursor-pointer transition-colors">
            <span className="text-xs text-slate-300 font-medium">Drag & drop your resume file here or click to browse</span>
          </div>
        </div>
      )}
    </div>
  );
};
