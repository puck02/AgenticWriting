import { describe, expect, it } from "vitest";

import { reviewResultSchema } from "@/domain/review-schema";

const completeReviewResult = {
  overallScore: 17,
  summary: "文章结构完整，表达清晰。",
  priority: "优先提升论证细节。",
  categoryScores: {
    content: 4,
    accuracy: 4,
    richness: 3,
    coherence: 4
  },
  errorPatterns: ["论据略泛"],
  suggestions: [
    {
      originalSentence: "People should protect the environment.",
      suggestedSentence:
        "Individuals should make consistent efforts to protect the environment.",
      reason: "表达更具体。",
      expressionIntent: "强调持续行动",
      topic: "environment",
      preferenceLabel: "正式但不过度复杂",
      profileExplanation: "符合用户偏好的正式表达。"
    }
  ]
};

describe("reviewResultSchema", () => {
  it("parses a complete structured review result", () => {
    expect(reviewResultSchema.parse(completeReviewResult)).toEqual(
      completeReviewResult
    );
  });

  it("rejects an overall score greater than 20", () => {
    expect(() =>
      reviewResultSchema.parse({
        ...completeReviewResult,
        overallScore: 21
      })
    ).toThrow();
  });

  it("rejects a category score greater than 5", () => {
    expect(() =>
      reviewResultSchema.parse({
        ...completeReviewResult,
        categoryScores: {
          ...completeReviewResult.categoryScores,
          richness: 6
        }
      })
    ).toThrow();
  });

  it("rejects an empty suggestion string", () => {
    expect(() =>
      reviewResultSchema.parse({
        ...completeReviewResult,
        suggestions: [
          {
            ...completeReviewResult.suggestions[0],
            reason: ""
          }
        ]
      })
    ).toThrow();
  });
});
