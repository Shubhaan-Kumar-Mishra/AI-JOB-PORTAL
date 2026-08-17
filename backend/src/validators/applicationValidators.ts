import { z } from 'zod';

export const applicationStatusEnum = z.enum(['applied', 'under_review', 'interview', 'offer', 'rejected'], {
  errorMap: () => ({ message: "Status must be one of 'applied', 'under_review', 'interview', 'offer', or 'rejected'" }),
});

export const createApplicationSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  jobTitle: z.string().optional().default('Job Position'),
  companyName: z.string().optional().default('Company Not Specified'),
  location: z.string().optional().default('Location Not Specified'),
  jobUrl: z.string().optional().default('https://www.adzuna.in'),
  notes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional().default(''),
});

export const updateApplicationSchema = z
  .object({
    status: applicationStatusEnum.optional(),
    notes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional(),
  })
  .refine((data) => data.status !== undefined || data.notes !== undefined, {
    message: 'At least one field (status or notes) must be provided for update',
  });

export const applicationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1, 'Page must be a positive integer')),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().int().min(1).max(50, 'Limit cannot exceed 50')),
  status: applicationStatusEnum.optional(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
