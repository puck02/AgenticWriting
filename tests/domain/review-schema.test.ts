import { describe, expect, it } from "vitest";

import { reviewResultSchema } from "@/domain/review-schema";
import type { MemorySnapshot } from "@/domain/memory";
import { DeterministicReviewer } from "@/services/review/llm-reviewer";

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

  it("allows profile explanation to be omitted", () => {
    const [{ profileExplanation, ...suggestion }] =
      completeReviewResult.suggestions;

    expect(
      reviewResultSchema.parse({
        ...completeReviewResult,
        suggestions: [suggestion]
      }).suggestions[0].profileExplanation
    ).toBeUndefined();
  });

  it("rejects an empty profile explanation when present", () => {
    expect(() =>
      reviewResultSchema.parse({
        ...completeReviewResult,
        suggestions: [
          {
            ...completeReviewResult.suggestions[0],
            profileExplanation: ""
          }
        ]
      })
    ).toThrow();
  });

  it("parses deterministic reviewer output when memory contains an empty preference label", async () => {
    const reviewer = new DeterministicReviewer();
    const result = await reviewer.reviewEssay({
      essayType: "ENGLISH_ONE_PICTURE",
      prompt: "环境保护",
      content: "People should protect the environment.",
      memory: memoryWithEmptyPreferenceLabel()
    });

    expect(() => reviewResultSchema.parse(result)).not.toThrow();
    expect(result.suggestions[0].preferenceLabel).toBe("正式但不过度复杂");
  });
});

function memoryWithEmptyPreferenceLabel(): MemorySnapshot {
  return {
    preferences: [
      {
        id: "preference-1",
        label: "",
        acceptCount: 1,
        rejectCount: 0,
        essayType: "ENGLISH_ONE_PICTURE"
      }
    ],
    errorPatterns: [],
    expressions: []
  };
}
