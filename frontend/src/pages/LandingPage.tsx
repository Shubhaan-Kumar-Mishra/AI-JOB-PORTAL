import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Sparkles, FileText, CheckCircle2, Zap, ArrowRight, Star, Target, Mail } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-brand-600/15 via-accent-600/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20 mb-6 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <span>Powered by Google Gemini AI & Adzuna Live Jobs</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-[1.15]">
          Supercharge Your Job Search With <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-brand-400 via-accent-400 to-indigo-300 bg-clip-text text-transparent">
            AI-Powered Resume Match Scores
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
          Upload your resume, discover real-time jobs from Adzuna, and get instant, tailored Gemini AI feedback and compatibility analysis.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-500 hover:to-accent-500 text-white font-semibold text-base shadow-xl shadow-brand-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
          >
            Create Your Account <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 text-slate-200 hover:text-white font-semibold text-base border border-slate-800 transition-all flex items-center justify-center gap-2"
          >
            Explore Dashboard Demo
          </Link>
        </div>

        {/* Interactive AI Preview Card Mockup */}
        <div className="mt-16 max-w-4xl mx-auto glass-panel rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-800 text-left">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                Live AI Match Preview
              </div>
              <h3 className="text-xl font-bold text-white">Senior Full-Stack Engineer</h3>
              <p className="text-sm text-slate-400">Adzuna Listing • San Francisco, CA (Hybrid)</p>
            </div>
            <div className="flex items-center gap-3 bg-slate-900/90 px-4 py-2.5 rounded-xl border border-slate-800">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-emerald-500/20">
                94%
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Match Score</div>
                <div className="text-sm font-semibold text-emerald-400">Strong Match</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Key Skill Strengths
              </h4>
              <ul className="text-xs text-slate-400 space-y-1.5 pl-6 list-disc">
                <li>Strong React, TypeScript, and state management experience</li>
                <li>Proven background in Node.js & microservices</li>
                <li>Cloudflare Workers & Edge execution exposure</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" /> AI Optimization Tip
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                "Highlight your experience with REST API design and CI/CD pipelines in your resume header to increase score to 98%."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-900">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Designed for Modern Job Seekers & Engineers
          </h2>
          <p className="mt-3 text-slate-400 text-base max-w-xl mx-auto">
            Everything you need to find, apply, and land your dream tech role.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-brand-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-5">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Real Job Listings</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Integrates directly with Adzuna API to bring real-time, high-paying tech and engineering opportunities worldwide.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-brand-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center text-accent-400 mb-5">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Gemini AI Resume Match</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Get an instant job compatibility score, skill gap analysis, and tailored bullet-point recommendations using Google Gemini.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-brand-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Application Tracker</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Keep all your saved jobs and active applications organized in one unified, real-time dashboard.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
