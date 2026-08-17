import { z } from 'zod';

export const jobSearchQuerySchema = z.object({
  keyword: z.string().optional().default(''),
  location: z.string().optional().default(''),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1, 'Page must be a positive integer')),
  resultsPerPage: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1).max(50, 'Results per page cannot exceed 50')),
  sortBy: z
    .enum(['relevance', 'date', 'salary'])
    .optional()
    .default('relevance'),
  salaryMin: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  salaryMax: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  fullTime: z
    .string()
    .optional()
    .transform((val) => (val === '1' || val === 'true' ? '1' : undefined)),
  permanent: z
    .string()
    .optional()
    .transform((val) => (val === '1' || val === 'true' ? '1' : undefined)),
});

export type JobSearchQueryInput = z.infer<typeof jobSearchQuerySchema>;
