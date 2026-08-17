import { z } from 'zod';

export const jobSearchQuerySchema = z
  .object({
    keyword: z.string().optional().default(''),
    location: z.string().optional().default(''),
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .pipe(z.number().int({ message: 'Page must be an integer' }).min(1, 'Page must be a positive integer (min 1)')),
    resultsPerPage: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 20))
      .pipe(
        z
          .number()
          .int()
          .min(1, 'Results per page must be at least 1')
          .max(50, 'Results per page cannot exceed 50')
      ),
    sortBy: z
      .enum(['relevance', 'date', 'salary'], {
        errorMap: () => ({ message: "sortBy must be one of 'relevance', 'date', or 'salary'" }),
      })
      .optional()
      .default('relevance'),
    salaryMin: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined))
      .pipe(z.number().min(0, 'Minimum salary must be non-negative').optional()),
    salaryMax: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined))
      .pipe(z.number().min(0, 'Maximum salary must be non-negative').optional()),
    fullTime: z
      .string()
      .optional()
      .transform((val) => (val === '1' || val === 'true' ? '1' : undefined)),
    permanent: z
      .string()
      .optional()
      .transform((val) => (val === '1' || val === 'true' ? '1' : undefined)),
  })
  .refine(
    (data) => {
      if (data.salaryMin !== undefined && data.salaryMax !== undefined) {
        return data.salaryMin <= data.salaryMax;
      }
      return true;
    },
    {
      message: 'salaryMin must be less than or equal to salaryMax',
      path: ['salaryMin'],
    }
  );

export type JobSearchQueryInput = z.infer<typeof jobSearchQuerySchema>;
