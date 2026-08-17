import React from 'react';
import { Briefcase, Github, Shield, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 text-slate-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white tracking-tight text-lg">AI Job Portal</span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Next-generation career engine powered by Cloudflare Workers, Hono, React, MongoDB Atlas, and Google Gemini AI. Match your resume with real job listings in seconds.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-200 mb-3 uppercase tracking-wider">Architecture</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-brand-400" /> Cloudflare Workers</li>
              <li className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-brand-400" /> Hono Framework</li>
              <li className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-brand-400" /> MongoDB Atlas</li>
              <li className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-brand-400" /> Google Gemini AI</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-200 mb-3 uppercase tracking-wider">Integrations</h4>
            <ul className="space-y-2 text-sm">
              <li>Adzuna Jobs API</li>
              <li>Google Gemini API</li>
              <li>Resend Email Service</li>
              <li>TypeScript Monorepo</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} AI Job Portal. Built for high performance & modern career matching.</p>
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1 text-slate-500">
              <Shield className="w-3.5 h-3.5 text-emerald-400" /> Production-Grade Architecture
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
