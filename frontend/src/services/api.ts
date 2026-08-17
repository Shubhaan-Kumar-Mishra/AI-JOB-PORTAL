import axios from 'axios';

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: 'candidate' | 'admin';
  skills: string[];
  education: Array<{
    _id?: string;
    degree: string;
    institution: string;
    year?: number;
    fieldOfStudy?: string;
  }>;
  experience: Array<{
    _id?: string;
    title: string;
    company: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    description?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: SafeUser;
  error?: {
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export interface StandardJob {
  id: string;
  title: string;
  company: {
    name: string;
  };
  location: {
    displayName: string;
    area?: string[];
  };
  description: string;
  salary: {
    min: number | null;
    max: number | null;
    isPredicted: boolean;
  };
  url: string;
  created: string;
  contractType: string | null;
  contractTime: string | null;
  category: string;
}

export interface StandardJobSearchResponse {
  success: boolean;
  data: {
    jobs: StandardJob[];
    pagination: {
      page: number;
      resultsPerPage: number;
      total: number;
      totalPages: number;
    };
    country: string;
    attribution: {
      text: string;
      link: string;
    };
  };
  error?: {
    message: string;
  };
}

export interface JobSearchParams {
  keyword?: string;
  location?: string;
  page?: number;
  resultsPerPage?: number;
  sortBy?: 'relevance' | 'date' | 'salary';
  salaryMin?: number;
  salaryMax?: number;
  fullTime?: boolean;
  permanent?: boolean;
}

export interface SavedJobItem {
  _id: string;
  userId: string;
  jobId: string;
  title: string;
  companyName: string;
  location: string;
  jobUrl: string;
  salary?: {
    min?: number | null;
    max?: number | null;
    isPredicted?: boolean;
  };
  savedAt: string;
  createdAt: string;
}

export type ApplicationStatus = 'applied' | 'under_review' | 'interview' | 'offer' | 'rejected';

export interface ApplicationItem {
  _id: string;
  userId: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  location: string;
  jobUrl: string;
  status: ApplicationStatus;
  notes?: string;
  appliedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  savedJobsCount: number;
  applicationsCount: number;
  interviewsCount: number;
  offersCount: number;
}

export interface ParsedEducation {
  institution: string | null;
  degree: string | null;
  field: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface ParsedExperience {
  company: string | null;
  position: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
}

export interface ParsedProject {
  name: string | null;
  description: string | null;
  technologies: string[];
}

export interface ParsedResumeData {
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  summary: string | null;
  skills: string[];
  education: ParsedEducation[];
  experience: ParsedExperience[];
  projects: ParsedProject[];
}

export interface ResumeItem {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'docx';
  fileSize: number;
  parsedData: ParsedResumeData;
  uploadedAt: string;
}

export interface AIAnalysisResult {
  matchScore: number;
  overallAssessment: string;
  matchingSkills: string[];
  missingSkills: string[];
  relevantExperience: string[];
  relevantProjects: string[];
  strengths: string[];
  concerns: string[];
  improvementSuggestions: string[];
  recommendation: 'strong_match' | 'good_match' | 'partial_match' | 'weak_match';
}

export interface JobRecommendation {
  jobId: string;
  matchScore: number;
  recommendationReason: string;
  matchingSkills: string[];
  missingSkills: string[];
  highlights: string[];
  job: StandardJob;
}

export interface GetRecommendationsResponse {
  success: boolean;
  message?: string;
  data?: {
    recommendations: JobRecommendation[];
    count: number;
  };
  error?: {
    message: string;
  };
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
});

// Request interceptor: Attach JWT Bearer token if present in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config.url?.includes('/auth/login')) {
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

// Health Check API
export async function checkBackendHealth() {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    return { success: false, message: 'Backend unreachable' };
  }
}

// Auth API Methods
export async function registerApi(data: { name: string; email: string; password: string }): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/register', data);
  return response.data;
}

export async function loginApi(data: { email: string; password: string }): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/login', data);
  return response.data;
}

export async function getMeApi(): Promise<AuthResponse> {
  const response = await api.get<AuthResponse>('/auth/me');
  return response.data;
}

export async function updateProfileApi(data: {
  name?: string;
  skills?: string[];
  education?: any[];
  experience?: any[];
}): Promise<AuthResponse> {
  const response = await api.put<AuthResponse>('/auth/profile', data);
  return response.data;
}

export async function logoutApi(): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/logout');
  return response.data;
}

// Job Search API Methods
export async function searchJobsApi(params: JobSearchParams): Promise<StandardJobSearchResponse> {
  const response = await api.get<StandardJobSearchResponse>('/jobs/search', {
    params: {
      keyword: params.keyword || undefined,
      location: params.location || undefined,
      page: params.page || 1,
      resultsPerPage: params.resultsPerPage || 20,
      sortBy: params.sortBy || 'relevance',
      salaryMin: params.salaryMin || undefined,
      salaryMax: params.salaryMax || undefined,
      fullTime: params.fullTime ? '1' : undefined,
      permanent: params.permanent ? '1' : undefined,
    },
  });
  return response.data;
}

export async function getJobDetailsApi(
  id: string
): Promise<{ success: boolean; data: { job: StandardJob; attribution: { text: string; link: string } } }> {
  const response = await api.get(`/jobs/${id}`);
  return response.data;
}

// Saved Jobs API Methods
export async function saveJobApi(
  jobId: string,
  snapshot?: { title?: string; companyName?: string; location?: string; jobUrl?: string; salary?: any }
): Promise<{ success: boolean; message: string; data: { savedJob: SavedJobItem } }> {
  const response = await api.post(`/jobs/${jobId}/save`, snapshot || {});
  return response.data;
}

export async function removeSavedJobApi(
  jobId: string
): Promise<{ success: boolean; message: string; data: { jobId: string } }> {
  const response = await api.delete(`/jobs/${jobId}/save`);
  return response.data;
}

export async function getSavedJobsApi(
  page = 1,
  limit = 20
): Promise<{
  success: boolean;
  data: { savedJobs: SavedJobItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
}> {
  const response = await api.get('/users/saved-jobs', { params: { page, limit } });
  return response.data;
}

export async function checkJobSavedApi(
  jobId: string
): Promise<{ success: boolean; data: { saved: boolean; savedJobId: string | null } }> {
  const response = await api.get(`/jobs/${jobId}/saved`);
  return response.data;
}

// Application Tracking API Methods
export async function createApplicationApi(data: {
  jobId: string;
  jobTitle?: string;
  companyName?: string;
  location?: string;
  jobUrl?: string;
  notes?: string;
}): Promise<{ success: boolean; message: string; data: { application: ApplicationItem } }> {
  const response = await api.post('/applications', data);
  return response.data;
}

export async function getApplicationsApi(
  page = 1,
  limit = 10,
  status?: ApplicationStatus
): Promise<{
  success: boolean;
  data: { applications: ApplicationItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
}> {
  const response = await api.get('/applications', { params: { page, limit, status } });
  return response.data;
}

export async function getApplicationByIdApi(
  id: string
): Promise<{ success: boolean; data: { application: ApplicationItem } }> {
  const response = await api.get(`/applications/${id}`);
  return response.data;
}

export async function updateApplicationApi(
  id: string,
  data: { status?: ApplicationStatus; notes?: string }
): Promise<{ success: boolean; message: string; data: { application: ApplicationItem } }> {
  const response = await api.patch(`/applications/${id}`, data);
  return response.data;
}

export async function deleteApplicationApi(
  id: string
): Promise<{ success: boolean; message: string; data: { id: string } }> {
  const response = await api.delete(`/applications/${id}`);
  return response.data;
}

export async function getDashboardStatsApi(): Promise<{
  success: boolean;
  data: DashboardStats;
}> {
  const response = await api.get('/users/dashboard-stats');
  return response.data;
}

// Resume API Methods
export async function uploadResumeApi(
  formData: FormData
): Promise<{ success: boolean; message: string; data: { resume: ResumeItem } }> {
  const response = await api.post('/resume', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function getResumeApi(): Promise<{
  success: boolean;
  data: { resume: ResumeItem };
}> {
  const response = await api.get('/resume');
  return response.data;
}

export async function deleteResumeApi(): Promise<{
  success: boolean;
  message: string;
}> {
  const response = await api.delete('/resume');
  return response.data;
}

export async function getResumeStatusApi(): Promise<{
  success: boolean;
  data: {
    hasResume: boolean;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
    uploadedAt?: string;
  };
}> {
  const response = await api.get('/resume/status');
  return response.data;
}

// Gemini AI Match API Method
export async function analyzeJobMatchApi(
  jobId: string
): Promise<{
  success: boolean;
  data?: {
    job: { id: string; title: string; company: string };
    analysis: AIAnalysisResult;
  };
  message?: string;
  error?: { message: string };
}> {
  const response = await api.post(`/ai/job-match/${jobId}`);
  return response.data;
}

// AI Personalized Job Recommendations API Method
export async function getRecommendationsApi(
  refresh = false
): Promise<GetRecommendationsResponse> {
  const response = await api.get<GetRecommendationsResponse>('/ai/recommendations', {
    params: refresh ? { refresh: 'true' } : undefined,
  });
  return response.data;
}
