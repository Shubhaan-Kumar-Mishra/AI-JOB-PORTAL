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
    attribution: {
      text: string;
      link: string;
    };
  };
}

/**
 * Service to interact with the official Adzuna Job Search API.
 * Target Market: India (`in` country code endpoint).
 * Endpoint URL: https://api.adzuna.com/v1/api/jobs/in/search/{page}
 */
export async function fetchAdzunaJobs(params: JobSearchQueryInput): Promise<StandardJobSearchResponse> {
  const appId = config.adzunaAppId;
  const appKey = config.adzunaAppKey;

  // Validate environment credentials exist before making external call
  if (!appId || !appKey) {
    throw new Error('Adzuna API credentials (ADZUNA_APP_ID / ADZUNA_APP_KEY) are not configured in environment variables.');
  }

  const country = 'in'; // Explicit target country: India
  const page = params.page || 1;
  const resultsPerPage = params.resultsPerPage || 20;

  // Construct official Adzuna API request URL for India
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
        throw new Error('Invalid query parameters sent to Adzuna API.');
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error('Adzuna API authentication failed. Please check ADZUNA_APP_ID and ADZUNA_APP_KEY.');
      }
      if (response.status === 429) {
        throw new Error('Adzuna API rate limit exceeded. Please wait a moment before trying again.');
      }
      throw new Error(`Adzuna API service error: status code ${response.status}`);
    }

    const rawData = (await response.json()) as any;

    if (!rawData || !Array.isArray(rawData.results)) {
      throw new Error('Malformed JSON payload received from Adzuna API.');
    }

    // Transform raw Adzuna fields into our standard model
    const jobs: StandardJob[] = rawData.results.map((item: any) => ({
      id: String(item.id || item.adref || Math.random().toString(36).substring(2, 9)),
      title: stripHtmlTags(item.title || 'Job Opportunity'),
      company: {
        name: item.company?.display_name || 'Company Not Specified',
      },
      location: {
        displayName: item.location?.display_name || 'India',
        area: item.location?.area || [],
      },
      description: stripHtmlTags(item.description || 'No job summary snippet provided.'),
      salary: {
        min: item.salary_min !== undefined ? Math.round(item.salary_min) : null,
        max: item.salary_max !== undefined ? Math.round(item.salary_max) : null,
        isPredicted: item.salary_is_predicted === '1' || item.salary_is_predicted === 1,
      },
      url: item.redirect_url || 'https://www.adzuna.in',
      created: item.created || new Date().toISOString(),
      contractType: item.contract_type || null,
      contractTime: item.contract_time || null,
      category: item.category?.label || 'General',
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
        attribution: {
          text: 'Jobs by Adzuna',
          link: 'https://www.adzuna.in',
        },
      },
    };
  } catch (error: any) {
    console.error('[Adzuna Service Error]:', error.message || error);
    throw error;
  }
}

/**
 * Utility to strip HTML tags from Adzuna text fields.
 */
function stripHtmlTags(str: string): string {
  if (!str) return '';
  return str.replace(/<\/?[^>]+(>|$)/g, '').trim();
}
