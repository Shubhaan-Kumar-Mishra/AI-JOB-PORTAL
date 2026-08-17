import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Briefcase, Sparkles, User, LogIn, Activity } from 'lucide-react';
import { checkBackendHealth } from '../services/api';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    checkBackendHealth().then((res) => {
      setApiOnline(res?.success === true);
    });
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              AI Job Portal
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                <Sparkles className="w-3 h-3 mr-1" /> AI Powered
              </span>
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1">
          <Link
            to="/"
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/')
                ? 'text-white bg-slate-800/60'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            Home
          </Link>
          <Link
            to="/dashboard"
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/dashboard')
                ? 'text-white bg-slate-800/60'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            Dashboard
          </Link>
        </nav>

        {/* Status & Auth Actions */}
        <div className="flex items-center space-x-4">
          {/* API Health Badge */}
          <div
            title={apiOnline ? 'Backend API connected' : 'Connecting to API...'}
            className="hidden sm:flex items-center space-x-2 text-xs px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800"
          >
            <Activity
              className={`w-3.5 h-3.5 ${
                apiOnline === true
                  ? 'text-emerald-400 animate-pulse'
                  : apiOnline === false
                  ? 'text-rose-400'
                  : 'text-amber-400 animate-spin'
              }`}
            />
            <span className="text-slate-400 font-medium">
              {apiOnline === true
                ? 'API Online'
                : apiOnline === false
                ? 'API Offline'
                : 'Connecting...'}
            </span>
          </div>

          <Link
            to="/login"
            className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800/40 transition-colors flex items-center gap-1.5"
          >
            <LogIn className="w-4 h-4" /> Sign In
          </Link>
          <Link
            to="/register"
            className="text-sm font-semibold text-white px-4 py-2 rounded-lg bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-500 hover:to-accent-500 shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5 hover:scale-[1.02]"
          >
            <User className="w-4 h-4" /> Get Started
          </Link>
        </div>
      </div>
    </header>
  );
};
