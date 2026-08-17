import React, { useEffect, useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Sparkles,
  FileCheck,
  Download,
} from 'lucide-react';
import {
  uploadResumeApi,
  getResumeApi,
  deleteResumeApi,
  ResumeItem,
  ParsedResumeData,
} from '../services/api';

export const ResumePage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [resume, setResume] = useState<ResumeItem | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchResume = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await getResumeApi();
      if (res.success && res.data?.resume) {
        setResume(res.data.resume);
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        console.error('Fetch resume error:', err);
        setErrorMsg('Failed to load resume details.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResume();
  }, []);

  const validateFile = (file: File): string | null => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx' && ext !== 'doc') {
      return 'Invalid file type. Only PDF (.pdf) and Word (.docx) documents are supported.';
    }
    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      return `File size exceeds maximum limit of 10 MB. Selected file is ${(file.size / (1024 * 1024)).toFixed(1)} MB.`;
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const err = validateFile(file);
    if (err) {
      setErrorMsg(err);
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const formData = new FormData();
      formData.append('resume', selectedFile);

      const res = await uploadResumeApi(formData);
      if (res.success && res.data?.resume) {
        setResume(res.data.resume);
        setSelectedFile(null);
        setSuccessMsg('Resume uploaded and parsed successfully!');
      }
    } catch (err: any) {
      console.error('Resume upload error:', err);
      setErrorMsg(
        err.response?.data?.error?.message ||
          'Failed to upload resume. Please ensure your PDF or DOCX file contains readable text.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!resume) return;
    if (!window.confirm('Are you sure you want to delete your stored resume and parsed profile data?')) {
      return;
    }

    try {
      setIsDeleting(true);
      setErrorMsg(null);
      await deleteResumeApi();
      setResume(null);
      setSuccessMsg('Resume deleted successfully.');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to delete resume.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (e) {
      return 'Recently uploaded';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          <span className="text-sm font-medium text-slate-400">Loading resume profile...</span>
        </div>
      </div>
    );
  }

  const parsed = resume?.parsedData;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" /> Stage 5 Resume Parser
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Resume Management & Data Parsing</h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload your text-based PDF or DOCX resume to extract structured technical skills, education, and work history.
          </p>
        </div>

        {resume && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-brand-400" /> Replace Resume
            </button>
            <button
              disabled={isDeleting}
              onClick={handleDeleteResume}
              className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-semibold text-xs transition-colors inline-flex items-center gap-2 disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
            </button>
          </div>
        )}
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-300 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-300 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {/* Upload Zone (Show if no resume or replacing) */}
      {(!resume || selectedFile) && (
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-brand-400" /> Upload Document
          </h2>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-brand-500 bg-brand-500/10'
                : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-4 text-brand-400">
              <FileText className="w-8 h-8" />
            </div>

            <h3 className="text-base font-bold text-white mb-1">
              Drag & Drop your resume here, or <span className="text-brand-400 underline">browse files</span>
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              Supported formats: <strong className="text-slate-300">PDF (.pdf)</strong> and <strong className="text-slate-300">Word (.docx)</strong>. Maximum file size: <strong className="text-slate-300">10 MB</strong>.
            </p>

            {selectedFile && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-brand-300 text-xs font-semibold border border-brand-500/30">
                <FileCheck className="w-4 h-4 text-emerald-400" /> {selectedFile.name} (
                {formatFileSize(selectedFile.size)})
              </div>
            )}
          </div>

          {selectedFile && (
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedFile(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-semibold border border-slate-800"
              >
                Cancel
              </button>

              <button
                disabled={isUploading}
                onClick={handleUploadSubmit}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-500 hover:to-accent-500 text-white font-bold text-xs shadow-lg shadow-brand-500/20 transition-all inline-flex items-center gap-2 disabled:opacity-60"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Extracting & Parsing Text...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> Confirm & Upload Resume
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Structured Resume Display */}
      {resume && parsed && (
        <div className="space-y-8">
          {/* Active File Summary Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 uppercase font-black text-xs">
                {resume.fileType}
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  {resume.fileName} <span className="text-xs text-slate-500 font-normal">({formatFileSize(resume.fileSize)})</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Uploaded on {formatDate(resume.uploadedAt)} • In-Memory Extraction Active
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Parsed Successfully
              </span>
            </div>
          </div>

          {/* Profile Overview */}
          <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-4">
              <User className="w-5 h-5 text-brand-400" /> Extracted Candidate Profile
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium">Candidate Name</span>
                <p className="font-bold text-white">{parsed.name || 'Not detected in document'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium">Email Address</span>
                <p className="font-bold text-white flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-brand-400" /> {parsed.email || 'Not detected'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium">Phone Number</span>
                <p className="font-bold text-white flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-400" /> {parsed.phone || 'Not detected'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium">Location</span>
                <p className="font-bold text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-purple-400" /> {parsed.location || 'Not detected'}
                </p>
              </div>
            </div>

            {parsed.summary && (
              <div className="pt-4 border-t border-slate-800/80 space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Professional Summary</span>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800/60">
                  {parsed.summary}
                </p>
              </div>
            )}
          </div>

          {/* Skills Chips */}
          <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-4">
              <Sparkles className="w-5 h-5 text-brand-400" /> Identified Technical Skills ({parsed.skills.length})
            </h3>

            {parsed.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {parsed.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No technical skills automatically identified in resume text.</p>
            )}
          </div>

          {/* Education Timeline */}
          <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-4">
              <GraduationCap className="w-5 h-5 text-brand-400" /> Education & Qualifications ({parsed.education.length})
            </h3>

            {parsed.education.length > 0 ? (
              <div className="space-y-4">
                {parsed.education.map((edu, index) => (
                  <div key={index} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <h4 className="text-sm font-bold text-white">{edu.degree || 'Degree Program'}</h4>
                    <p className="text-xs text-slate-300 font-medium">{edu.institution || 'Educational Institution'}</p>
                    {(edu.startDate || edu.endDate) && (
                      <span className="text-[11px] text-slate-500 font-medium block pt-1">
                        {edu.startDate ? `${edu.startDate} - ` : ''}
                        {edu.endDate || 'Present'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No formal education entries automatically identified.</p>
            )}
          </div>

          {/* Experience Timeline */}
          <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-4">
              <Briefcase className="w-5 h-5 text-brand-400" /> Work Experience ({parsed.experience.length})
            </h3>

            {parsed.experience.length > 0 ? (
              <div className="space-y-4">
                {parsed.experience.map((exp, index) => (
                  <div key={index} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h4 className="text-base font-bold text-white">{exp.position || 'Professional Position'}</h4>
                      {(exp.startDate || exp.endDate) && (
                        <span className="text-xs text-brand-400 font-semibold">
                          {exp.startDate ? `${exp.startDate} - ` : ''}
                          {exp.endDate || 'Present'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 font-semibold">{exp.company || 'Company'}</p>
                    {exp.description && (
                      <p className="text-xs text-slate-400 leading-relaxed pt-1">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No work experience entries automatically identified.</p>
            )}
          </div>

          {/* Projects */}
          <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-4">
              <FolderGit2 className="w-5 h-5 text-brand-400" /> Key Projects ({parsed.projects.length})
            </h3>

            {parsed.projects.length > 0 ? (
              <div className="space-y-4">
                {parsed.projects.map((proj, index) => (
                  <div key={index} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <h4 className="text-sm font-bold text-white">{proj.name || 'Project'}</h4>
                    {proj.description && <p className="text-xs text-slate-400 leading-relaxed">{proj.description}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No project entries automatically identified.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
