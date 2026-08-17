import { config } from '../config/env.js';
import { JobSearchQueryInput } from '../validators/jobValidators.js';

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
}

/**
 * Service to interact with the official Adzuna Job Search API.
 * Uses Adzuna's India market endpoint (`in`) by default.
 */
export async function fetchAdzunaJobs(params: JobSearchQueryInput): Promise<StandardJobSearchResponse> {
  const appId = config.adzunaAppId;
  const appKey = config.adzunaAppKey;

  // Validate credentials exist
  if (!appId || !appKey) {
    throw new Error('Adzuna API credentials (ADZUNA_APP_ID / ADZUNA_APP_KEY) are not configured in environment variables.');
  }

  const country = 'in'; // Primary market: India
  const page = params.page || 1;
  const resultsPerPage = params.resultsPerPage || 20;

  // Construct Adzuna API URL safely
  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`);
  url.searchParams.append('app_id', appId);
  url.searchParams.append('app_key', appKey);
  url.searchParams.append('results_per_page', resultsPerPage.toString());

  if (params.keyword && params.keyword.trim() !== '') {
    url.searchParams.append('what', params.keyword.trim());
  }

  if (params.location && params.location.trim() !== '') {
    url.searchParams.append('where', params.location.trim());
  }

  if (params.sortBy) {
    if (params.sortBy === 'date') url.searchParams.append('sort_by', 'date');
    else if (params.sortBy === 'salary') url.searchParams.append('sort_by', 'salary');
  }

  if (params.salaryMin !== undefined) {
    url.searchParams.append('salary_min', params.salaryMin.toString());
  }

  if (params.salaryMax !== undefined) {
    url.searchParams.append('salary_max', params.salaryMax.toString());
  }

  if (params.fullTime === '1') {
    url.searchParams.append('full_time', '1');
  }

  if (params.permanent === '1') {
    url.searchParams.append('permanent', '1');
  }

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error('Invalid parameters sent to Adzuna API.');
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error('Adzuna API authentication failed. Please verify ADZUNA_APP_ID and ADZUNA_APP_KEY.');
      }
      if (response.status === 429) {
        throw new Error('Adzuna API rate limit exceeded. Please try again later.');
      }
      throw new Error(`Adzuna API returned error status ${response.status}`);
    }

    const rawData = (await response.json()) as any;

    if (!rawData || !Array.isArray(rawData.results)) {
      throw new Error('Unexpected response format received from Adzuna API.');
    }

    // Transform raw Adzuna response to our standard job format
    const jobs: StandardJob[] = rawData.results.map((item: any) => ({
      id: String(item.id || item.adref || Math.random().toString(36).substring(2, 9)),
      title: stripHtmlTags(item.title || 'Untitled Job Position'),
      company: {
        name: item.company?.display_name || 'Company Not Specified',
      },
      location: {
        displayName: item.location?.display_name || 'India',
        area: item.location?.area || [],
      },
      description: stripHtmlTags(item.description || 'No detailed description available.'),
      salary: {
        min: item.salary_min !== undefined ? Math.round(item.salary_min) : null,
        max: item.salary_max !== undefined ? Math.round(item.salary_max) : null,
        isPredicted: item.salary_is_predicted === '1' || item.salary_is_predicted === 1,
      },
      url: item.redirect_url || '#',
      created: item.created || new Date().toISOString(),
      contractType: item.contract_type || null,
      contractTime: item.contract_time || null,
      category: item.category?.label || 'Technology & Engineering',
    }));

    const total = rawData.count || jobs.length;
    const totalPages = Math.max(1, Math.ceil(total / resultsPerPage));

    return {
      success: true,
      data: {
        jobs,
        pagination: {
          page,
          resultsPerPage,
          total,
          totalPages,
        },
        country: 'India (in)',
        attribution: 'Jobs powered by Adzuna',
      },
    };
  } catch (error: any) {
    console.error('Error fetching Adzuna jobs:', error.message || error);
    throw error;
  }
}

/**
 * Helper utility to remove HTML formatting tags from string values.
 */
function stripHtmlTags(str: string): string {
  if (!str) return '';
  return str.replace(/<\/?[^>]+(>|$)/g, '').trim();
}
