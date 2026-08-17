import { z } from 'zod';

export const jobMatchRecommendationEnum = z.enum([
  'strong_match',
  'good_match',
  'partial_match',
  'weak_match',
]);

export type JobMatchRecommendation = z.infer<typeof jobMatchRecommendationEnum>;

export const aiJobMatchResponseSchema = z.object({
  matchScore: z
    .number()
    .min(0, 'Match score must be at least 0')
    .max(100, 'Match score cannot exceed 100'),
  overallAssessment: z.string().max(1500, 'Overall assessment string too long'),
  matchingSkills: z.array(z.string().max(100)).max(25),
  missingSkills: z.array(z.string().max(100)).max(25),
  relevantExperience: z.array(z.string().max(300)).max(20),
  relevantProjects: z.array(z.string().max(300)).max(20),
  strengths: z.array(z.string().max(300)).max(20),
  concerns: z.array(z.string().max(300)).max(20),
  improvementSuggestions: z.array(z.string().max(300)).max(20),
  recommendation: jobMatchRecommendationEnum,
});

export type AIJobMatchResponse = z.infer<typeof aiJobMatchResponseSchema>;
