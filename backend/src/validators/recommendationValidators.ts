import { z } from 'zod';

export const recommendationItemSchema = z.object({
  jobId: z
    .string()
    .min(1, 'Job ID is required')
    .max(100, 'Job ID exceeds length limit'),
  matchScore: z
    .number()
    .int('Match score must be an integer')
    .min(0, 'Match score cannot be less than 0')
    .max(100, 'Match score cannot exceed 100'),
  recommendationReason: z
    .string()
    .min(1, 'Recommendation reason is required')
    .max(1000, 'Recommendation reason exceeds length limit'),
  matchingSkills: z
    .array(z.string().max(100))
    .max(20, 'Matching skills array exceeds limit'),
  missingSkills: z
    .array(z.string().max(100))
    .max(20, 'Missing skills array exceeds limit'),
  highlights: z
    .array(z.string().max(200))
    .max(10, 'Highlights array exceeds limit'),
});

export const recommendationResponseSchema = z.object({
  recommendations: z
    .array(recommendationItemSchema)
    .max(10, 'Cannot return more than 10 recommendations'),
});

export type RecommendationItem = z.infer<typeof recommendationItemSchema>;
export type RecommendationResponse = z.infer<typeof recommendationResponseSchema>;
