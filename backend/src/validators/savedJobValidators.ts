import { z } from 'zod';

export const saveJobSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  title: z.string().optional().default('Job Position'),
  companyName: z.string().optional().default('Company Not Specified'),
  location: z.string().optional().default('Location Not Specified'),
  jobUrl: z.string().optional().default('https://www.adzuna.in'),
  salary: z
    .object({
      min: z.number().nullable().optional(),
      max: z.number().nullable().optional(),
      isPredicted: z.boolean().optional(),
    })
    .optional(),
});

export type SaveJobInput = z.infer<typeof saveJobSchema>;
