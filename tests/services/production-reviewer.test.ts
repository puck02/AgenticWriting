import { describe, expect, it, vi } from "vitest";

import { FetchModelProvider } from "@/services/review/model-provider";
import { ProductionReviewer } from "@/services/review/production-reviewer";

const validReviewJson = JSON.stringify({
  overallScore: 16,
  summary: "The essay is clear.",
  priority: "Improve evidence.",
  categoryScores: {
    content: 4,
    accuracy: 4,
    richness: 4,
    coherence: 4
  },
  errorPatterns: ["论据不够具体"],
  suggestions: [
    {
      originalSentence: "Reading is important.",
      suggestedSentence: "Reading plays an important role in personal growth.",
      reason: "The revised sentence is more formal.",
      expressionIntent: "表达观点",
      topic: "reading",
      preferenceLabel: "正式但不过度复杂",
      profileExplanation: "Matches accepted preference."
    }
  ]
});

describe("ProductionReviewer", () => {
  it("returns a parsed structured review from the provider", async () => {
    const provider = {
      completeJson: vi.fn().mockResolvedValue(validReviewJson)
    };
    const reviewer = new ProductionReviewer({ provider, model: "test-model" });

    const review = await reviewer.reviewEssay({
      essayType: "ENGLISH_ONE_PICTURE",
      prompt: "Reading",
      content: "Reading is important.",
      memory: { preferences: [], errorPatterns: [], expressions: [] }
    });

    expect(review.overallScore).toBe(16);
    expect(provider.completeJson).toHaveBeenCalledOnce();
  });

  it("attempts one repair when provider output is invalid", async () => {
    const provider = {
      completeJson: vi
        .fn()
        .mockResolvedValueOnce("{\"overallScore\": 16}")
        .mockResolvedValueOnce(validReviewJson)
    };
    const reviewer = new ProductionReviewer({ provider, model: "test-model" });

    const review = await reviewer.reviewEssay({
      essayType: "ENGLISH_ONE_PICTURE",
      prompt: "Reading",
      content: "Reading is important.",
      memory: { preferences: [], errorPatterns: [], expressions: [] }
    });

    expect(review.overallScore).toBe(16);
    expect(provider.completeJson).toHaveBeenCalledTimes(2);
  });
});

describe("FetchModelProvider", () => {
  it("uses an OpenAI-compatible base URL for chat completions", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: validReviewJson } }]
      })
    });
    vi.stubGlobal("fetch", fetchMock);
    const provider = new FetchModelProvider({
      baseUrl: "https://provider.example/v1",
      apiKey: "test-key",
      model: "test-model"
    });

    const content = await provider.completeJson("review this essay");

    expect(content).toBe(validReviewJson);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://provider.example/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key"
        })
      })
    );
  });
});
