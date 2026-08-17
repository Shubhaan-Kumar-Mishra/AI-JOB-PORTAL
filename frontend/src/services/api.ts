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
    attribution: string;
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

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
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

export async function getJobDetailsApi(id: string): Promise<{ success: boolean; data: { job: StandardJob; attribution: string } }> {
  const response = await api.get(`/jobs/${id}`);
  return response.data;
}
