import { z } from "zod";

const nonEmptyString = z.string().min(1);
const categoryScoreSchema = z.number().int().min(0).max(5);

export const reviewSuggestionSchema = z.object({
  originalSentence: nonEmptyString,
  suggestedSentence: nonEmptyString,
  reason: nonEmptyString,
  expressionIntent: nonEmptyString,
  topic: nonEmptyString,
  preferenceLabel: nonEmptyString,
  profileExplanation: nonEmptyString.optional()
});

export const reviewResultSchema = z.object({
  overallScore: z.number().int().min(0).max(20),
  summary: nonEmptyString,
  priority: nonEmptyString,
  categoryScores: z.object({
    content: categoryScoreSchema,
    accuracy: categoryScoreSchema,
    richness: categoryScoreSchema,
    coherence: categoryScoreSchema
  }),
  errorPatterns: z.array(nonEmptyString),
  suggestions: z.array(reviewSuggestionSchema)
});

export type ReviewSuggestion = z.infer<typeof reviewSuggestionSchema>;
export type ReviewResult = z.infer<typeof reviewResultSchema>;
